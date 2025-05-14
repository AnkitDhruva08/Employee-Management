from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from core.models import Employee, Role, Company, NomineeDetails, BankDetails, OfficeDetails, EmployeeDocument, EmergencyContact, EmployeeDashboardLink
from core.serializers import EmployeeDocumentSerializer, EmployeeSerializer, BankDetailsSerializer,NomineeDetailsSerializer, EmergencyContactSerializer, EmployeeOfficeDetailsSerializer,EmployeeDashboardLinkSerializer
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import F, Value, CharField
from django.db.models.functions import Concat
import traceback
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings

User = get_user_model()

def to_bool(value):
    return str(value).lower() == 'true'

class EmployeeProfileViewSet(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Fetch employee details
            employee = Employee.objects.get(company_email=request.user.email)
            role_name = Role.objects.get(id=employee.role_id).role_name

            # Fetch related data
            emergency_contacts = EmergencyContact.objects.filter(employee=employee)
            office_details = OfficeDetails.objects.filter(employee=employee)

            # Serialize data
            employee_serializer = EmployeeSerializer(employee)
            emergency_contacts_serializer = EmergencyContactSerializer(emergency_contacts, many=True)
            office_details_serializer = EmployeeOfficeDetailsSerializer(office_details, many=True)

            # Combine all data into a single response
            profile_data = {
                'employee': employee_serializer.data,
                'role_name': role_name,
                'emergency_contacts': emergency_contacts_serializer.data,
                'office_details': office_details_serializer.data
            }

            return Response(profile_data, status=status.HTTP_200_OK)

        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# Employee ModelViewSet for Employee CRUD operations
class EmployeeViewSet(APIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk=None, *args, **kwargs):
            try:
                user = request.user
                user_email = user.email
                user_instance = User.objects.filter(email=user_email).first()

                if not user_instance:
                    return Response({'error': 'User not found'}, status=404)

                is_company = user_instance.is_company
                is_employee = user_instance.is_employee

                # Get company ID and role if employee
                employee_instance = None
                company_id = None
                role_id = None

                if is_company:
                    company = Company.objects.filter(email=user_email, active=True).first()
                    if not company:
                        return Response({'error': 'Company not found'}, status=404)
                    company_id = company.id

                if is_employee:
                    employee_instance = Employee.objects.filter(company_email=user_email).first()
                    if not employee_instance:
                        return Response({'error': 'Employee not found'}, status=404)
                    role_id = employee_instance.role_id
                    company_id = employee_instance.company_id

                # 🧠 CASE 1: Specific Employee Detail (Company or Employee)
                if pk:
                    employee = Employee.objects.filter(id=pk, company_id=company_id, active=True).select_related('role', 'company').first()
                    if not employee:
                        return Response({'error': 'Employee not found'}, status=404)

                    data = {
                        'id': employee.id,
                        'first_name': employee.first_name,
                        'middle_name': employee.middle_name,
                        'last_name': employee.last_name,
                        'contact_number': employee.contact_number,
                        'company_email': employee.company_email,
                        'personal_email': employee.personal_email,
                        'date_of_birth': employee.date_of_birth,
                        'gender': employee.gender,
                        'role_id': employee.role_id
                    }
                    return Response(data, status=200)

                # 🧠 CASE 2: All Employees (for Company or Admin/Manager roles)
                if is_company or role_id in [1, 2]:
                    employees = Employee.objects.filter(company_id=company_id, active=True) \
                        .select_related('role', 'company') \
                        .annotate(
                            username=Concat(F('first_name'), Value(' '), F('last_name'), output_field=CharField()),
                            role_name=F('role__role_name'),
                            company_name=F('company__company__company_name'),
                            team_size=F('company__company__team_size')
                        ).values(
                            'id', 'username', 'contact_number', 'company_email', 'personal_email',
                            'date_of_birth', 'gender', 'company_name', 'team_size', 'role_name'
                        ).order_by('-id')

                    return Response(employees, status=200)

                # 🧠 CASE 3: Regular Employee – return own data
                if is_employee:
                    employee = {
                        'id': employee_instance.id,
                        'first_name': employee_instance.first_name,
                        'middle_name': employee_instance.middle_name,
                        'last_name': employee_instance.last_name,
                        'contact_number': employee_instance.contact_number,
                        'company_email': employee_instance.company_email,
                        'personal_email': employee_instance.personal_email,
                        'date_of_birth': employee_instance.date_of_birth,
                        'gender': employee_instance.gender,
                        'role_id': employee_instance.role_id
                    }
                    return Response(employee, status=200)

                return Response({'error': 'Unauthorized'}, status=401)

            except Exception as e:
                print('Error:', e)
                return Response({'error': 'Something went wrong'}, status=500)

        
    def post(self, request, *args, **kwargs):
        data = request.data.copy()
        data['active'] = True
        username = request.user

        # Get company ID
        try:
            company_id = Company.objects.get(company_name=request.user).id
            company_name = Company.objects.get(id=company_id).company_name
        except Company.DoesNotExist:
            return Response({'error': 'Invalid company or user.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Get and validate role
        role_input = data.get('job_role') or data.get('Designation') or data.get('designation') or data.get('role')
        if not role_input:
            return Response({'error': 'Designation (Role) is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            role = Role.objects.get(id=int(role_input)) if str(role_input).isdigit() else Role.objects.get(role_name=role_input.strip())
        except Role.DoesNotExist:
            return Response({'error': f'Role "{role_input}" does not exist.'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Check if user exists
        email = data.get('company_email')
        default_password = "Pass@123"
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            try:
                user = User.objects.create_user(
                    username=data.get('first_name'),
                    email=email,
                    password=default_password,
                    first_name=data.get('first_name', ''),
                    last_name=data.get('last_name', ''),
                    is_employee=True
                )
            except Exception as e:
                print('[ERROR] User creation failed:', str(e))
                return Response({'error': f'User creation failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Check for existing Employee
        if Employee.objects.filter(company_email=email).exists():
            return Response({'error': 'Employee with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        # 4. Create employee
        try:
            employee = Employee.objects.create(
                first_name=data.get('first_name'),
                middle_name=data.get('middle_name'),
                last_name=data.get('last_name'),
                contact_number=data.get('contact_number'),
                company_email=email,
                personal_email=data.get('personal_email'),
                date_of_birth=data.get('date_of_birth'),
                gender=data.get('gender'),
                role_id=role.id,
                company_id=company_id
            )

            # 5. Send success email
            subject = f"Welcome to {company_name} Employee Management System Access Details"
            message = (
                f"Hi {data.get('first_name')} {data.get('last_name')},\n\n"
                "Welcome to our team! Your employee account has been successfully created.\n\n"
                "Below are your login credentials to access the Employee Management System:\n\n"
                f"🔗 Login URL: http://localhost:5173/login\n"
                f"📧 Username: {email}\n"
                f"🔐 Password: {default_password}\n\n"
                "For your security, please change your password after logging in.\n\n"
                "Through the portal, you can manage your profile, attendance, payroll, and more.\n\n"
                f"If you face any issues, contact IT support at support@{company_name}.com.\n\n"
                "Best regards,\n"
                f"{company_name} HR Team"
            )

            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])

            return Response({'success': 'Employee created and email sent successfully.'}, status=status.HTTP_201_CREATED)

        except Exception as e:
            print('[ERROR] Employee creation failed:', str(e))
            return Response({'error': f'Employee creation failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)



    # For Update Employee
    def put(self, request, pk=None, *args, **kwargs):
        username = request.user.email
        # Assuming you have an Employee model or serializer to update the employee
        try:
            # Fetch the employee by pk
            employee = Employee.objects.get(id=pk)

            # You can update the employee with data from the request
            employee.first_name = request.data.get('first_name', employee.first_name)
            employee.middle_name = request.data.get('middle_name', employee.middle_name)
            employee.last_name = request.data.get('last_name', employee.last_name)
            employee.contact_number = request.data.get('contact_number', employee.contact_number)
            employee.company_email = request.data.get('company_email', employee.company_email)
            employee.personal_email = request.data.get('personal_email', employee.personal_email)
            employee.date_of_birth = request.data.get('date_of_birth', employee.date_of_birth)
            employee.gender = request.data.get('gender', employee.gender)
            employee.role_id = request.data.get('job_role', employee.role_id)

            # Save the updated employee object
            employee.save()

            # Return success response
            return Response({
                'message': 'Employee updated successfully!',
                'employee': employee.id  # Optionally include updated data
            }, status=status.HTTP_200_OK)
            
        except Employee.DoesNotExist:
            return Response({
                'error': 'Employee not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            # Handle unexpected errors
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        
    # For Delete Employee
    def delete(self, request, pk=None, *args, **kwargs):
        try:
            employee = get_object_or_404(Employee, pk=pk)

            employee.active = False
            employee.save()

            return Response({'success': 'Employee deactivated successfully.'}, status=status.HTTP_200_OK)

        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
 

# Employee Bank Details CRUD operations
class EmployeeBankDetailsView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    def get(self, request, *args, **kwargs):
        pk = kwargs.get('pk', None)
        try:
            user_email = request.user.email
            is_company = Company.objects.filter(email=user_email).exists()

            if pk:
                try:
                    bank_detail = BankDetails.objects.get(employee_id=pk)
                    if is_company or bank_detail.employee.user.email == user_email:
                        serializer = BankDetailsSerializer(bank_detail)
                        return Response(serializer.data, status=status.HTTP_200_OK)
                    else:
                        return Response({'error': 'Unauthorized access'}, status=status.HTTP_403_FORBIDDEN)
                except BankDetails.DoesNotExist:
                    return Response({'error': 'Bank details not found'}, status=status.HTTP_404_NOT_FOUND)

            else:
                if is_company:
                    company = Company.objects.get(email=user_email)
                    employees = Employee.objects.filter(company_id=company.id)
                    bank_details = BankDetails.objects.filter(employee__in=employees)
                else:
                    employee = Employee.objects.get(company_email=user_email)
                    bank_details = BankDetails.objects.filter(employee=employee)

                serializer = BankDetailsSerializer(bank_details, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            employee = Employee.objects.get(company_email=request.user.email)
            data = request.data.copy()
            data['active'] = True

            data['employee'] = employee.id 

            serializer = BankDetailsSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response({'success': 'Bank details created successfully.'}, status=status.HTTP_201_CREATED)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, *args, **kwargs):
        pk = kwargs.get('pk', None)
        try:
            bank_details = BankDetails.objects.get(employee_id=pk)
        except BankDetails.DoesNotExist:
            return Response({'error': 'Bank details not found for the given ID'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        if 'active' in data:
            data['active'] = True
        data.pop('id', None)
        data.pop('employee', None)  # Optional: prevent accidental change

        serializer = BankDetailsSerializer(bank_details, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

# Nominee Details CRUD operations
class NomineeDetailsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk=None,*args, **kwargs):
        try:
            if pk:
                employee = Employee.objects.filter(id=pk).first()
                nominee_details = NomineeDetails.objects.filter(employee=employee)
                serializer = NomineeDetailsSerializer(nominee_details, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)

            employee = Employee.objects.get(company_email=request.user.email)
            nominee_details = NomineeDetails.objects.filter(employee=employee)
            serializer = NomineeDetailsSerializer(nominee_details, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def post(self, request, pk=None,*args, **kwargs):
        try:
            employee = Employee.objects.get(company_email=request.user.email)
            data = request.data.copy()
            data['active'] = True
            data['employee'] = employee.id 

            serializer = NomineeDetailsSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response({'success': 'Nominee details created successfully.'}, status=status.HTTP_201_CREATED)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        try:
            nominee_details = NomineeDetails.objects.get(employee_id=pk)
        except NomineeDetails.DoesNotExist:
            return Response({'error': 'Nominee details not found for the given ID'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
      

        # Remove non-editable fields
        for field in ['id', 'employee', 'created_at', 'updated_at']:
            data.pop(field, None)

        # Handle stringified nulls
        for field in ['created_by', 'updated_by']:
            if data.get(field) == 'null':
                data.pop(field)

        # Convert boolean fields
        data['active'] = True

        serializer = NomineeDetailsSerializer(nominee_details, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

# Employee Document Upload/Download Operations
class EmployeeDocumentUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

# get all documents of an employee
    def get(self, request, pk=None,*args, **kwargs):
        try:
            if pk:
                employee = Employee.objects.get(id=pk)
                employee_documents = EmployeeDocument.objects.filter(employee=employee)
                serializer = EmployeeDocumentSerializer(employee_documents, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)

            employee = Employee.objects.get(company_email=request.user.email)
            employee_documents = EmployeeDocument.objects.filter(employee=employee)
            serializer = EmployeeDocumentSerializer(employee_documents, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

# post a new document of an employee
    def post(self, request):
        try:
            employee = Employee.objects.get(company_email=request.user.email)
            
            data = request.data.copy()
            data['active'] = True

            data['employee'] = employee.id

            serializer = EmployeeDocumentSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response({'success': 'Employee document uploaded successfully.'}, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    
# update an existing document of an employee
    def put(self, request, pk):
        try:
            employee_document = EmployeeDocument.objects.get(employee_id=pk)
            data = request.data.copy()
            # Handle optional 'active' field safely
            data['active'] = True
            serializer = EmployeeDocumentSerializer(employee_document, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except EmployeeDocument.DoesNotExist:
            return Response({'error': 'Employee document not found for the given ID'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        

# Employee Emergency Contact CRUD operations
class EmployeeEmergencyContactView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk=None,*args, **kwargs):
        try:
            if pk:
                employee = Employee.objects.get(id=pk)
                emergency_contacts = EmergencyContact.objects.filter(employee=employee)
                serializer = EmergencyContactSerializer(emergency_contacts, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)

            employee = Employee.objects.get(company_email=request.user.email)
            emergency_contacts = EmergencyContact.objects.filter(employee=employee)
            serializer = EmergencyContactSerializer(emergency_contacts, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def post(self, request):
        try:
            employee = Employee.objects.get(company_email=request.user.email)
            data = request.data.copy()
            data['active'] = True

            data['employee'] = employee.id 

            serializer = EmergencyContactSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response({'success': 'Emergency contact created successfully.'}, status=status.HTTP_201_CREATED)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def put(self, request, pk):
        try:
            emergency_contact = EmergencyContact.objects.get(employee_id=pk)
        except EmergencyContact.DoesNotExist:
            return Response({'error': 'Emergency contact not found for the given ID'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data['active'] = True

        # Remove fields that shouldn't be updated
        for field in ['id', 'employee', 'created_at', 'updated_at']:
            data.pop(field, None)

        # Handle "null" strings
        for field in ['created_by', 'updated_by']:
            if data.get(field) == 'null':
                data.pop(field)

        # Convert "true"/"false" to boolean
        data['active'] = True

        serializer = EmergencyContactSerializer(emergency_contact, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

# Employee Offices  Details CRUD operations
class EmployeeOfficeDetailsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk=None,*args, **kwargs):
        try:
            if(pk):
                employee = Employee.objects.get(id=pk)
                office_details = OfficeDetails.objects.filter(employee=employee)
                serializer = EmployeeOfficeDetailsSerializer(office_details, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)
            
            # 
            employee = Employee.objects.get(company_email=request.user.email)
            office_details = OfficeDetails.objects.filter(employee=employee)
            serializer = EmployeeOfficeDetailsSerializer(office_details, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def post(self, request):
        try:
            employee = Employee.objects.get(company_email=request.user.email)
            data = request.data.copy()
            data['active'] = True

            data['employee'] = employee.id 

            serializer = EmployeeOfficeDetailsSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response({'success': 'Employee office details created successfully.'}, status=status.HTTP_201_CREATED)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def put(self, request, pk):
        try:
            employee_office_details = OfficeDetails.objects.get(employee_id=pk)
        except OfficeDetails.DoesNotExist:
            return Response({'error': 'Employee office details not found for the given ID'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data['active'] = True
        data.pop('id', None)
        data.pop('employee', None)

        serializer = EmployeeOfficeDetailsSerializer(employee_office_details, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    


class ProfileImageUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        image = request.FILES.get('profile_image')
        if not image:
            return Response({"error": "No image provided."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = request.user

            employee = Employee.objects.get(company_email=request.user.email)
            employee_id = employee.id

            employee.profile_image = image
            employee.save()

            return Response({"message": "Profile image uploaded successfully."}, status=status.HTTP_200_OK)

        except Employee.DoesNotExist:
            print("Employee not found for the user.")
            return Response({"error": "Employee not found."}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            return Response({"error": "Something went wrong."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        




class EmployeeFormViews(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None, *args, **kwargs):
        try:
            user = request.user
            admin_obj = Employee.objects.filter(company_email=user.email).first()
            role_id = admin_obj.role_id if admin_obj else None
            
            if not (user.is_company or role_id == 1):
                return Response({'error': 'Unauthorized access'}, status=status.HTTP_401_UNAUTHORIZED)

            # Fetch main employee instance
            employee = Employee.objects.filter(id=pk).first()
            if not employee:
                return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

            # Fetch related objects safely
            bank_detail = BankDetails.objects.filter(employee_id=pk).first()
            office_details = OfficeDetails.objects.filter(employee_id=pk).first()
            nominee_details = NomineeDetails.objects.filter(employee_id=pk).first()
            emergency_details = EmergencyContact.objects.filter(employee_id=pk).first()
            document_details = EmployeeDocument.objects.filter(employee_id=pk).first()

            # Serialize everything (handle None objects)
            employee_data = EmployeeSerializer(employee).data
            bank_data = BankDetailsSerializer(bank_detail).data if bank_detail else None
            office_data = EmployeeOfficeDetailsSerializer(office_details).data if office_details else None
            nominee_data = NomineeDetailsSerializer(nominee_details).data if nominee_details else None
            emergency_data = EmergencyContactSerializer(emergency_details).data if emergency_details else None
            document_data = EmployeeDocumentSerializer(document_details).data if document_details else None

            # Combine all data into a single response
            response_data = {
                'employee': employee_data,
                'bank_details': bank_data,
                'office_details': office_data,
                'nominee_details': nominee_data,
                'emergency_details': emergency_data,
                'document_details': document_data
            }

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            print('[EmployeeFormViews Error]:', str(e))
            return Response({'error': 'Something went wrong', 'details': str(e)}, status=status.HTTP_400_BAD_REQUEST)


