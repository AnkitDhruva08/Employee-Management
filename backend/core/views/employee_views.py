from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from core.models import Employee, Role, Company, NomineeDetails, BankDetails, OfficeDetails, EmployeeDocument, EmergencyContact, EmployeeDashboardLink
from core.serializers import CompanySerializer, EmployeeDocumentSerializer, EmployeeSerializer, BankDetailsSerializer,NomineeDetailsSerializer, EmergencyContactSerializer, EmployeeOfficeDetailsSerializer,EmployeeDashboardLinkSerializer
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import F, Value, CharField
from django.db.models.functions import Concat
import traceback
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings
from core.utils.utils import get_user_by_email, get_employee_by_email, get_company_by_email

User = get_user_model()

def to_bool(value):
    return str(value).lower() == 'true'


# Employee ModelViewSet for Employee CRUD operations
class EmployeeViewSet(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        try:
            user_email = request.user.email
            user = get_user_by_email(user_email)
            if not user:
                print("ERROR: User not found for email:", user_email)
                return Response({'error': 'User not found'}, status=404)

            is_company = user.is_company
            is_employee = user.is_employee
            company_id, role_id, employee_instance = None, None, None

            if is_company:
                company = get_company_by_email(user_email)
                if not company:
                    print("ERROR: Company not found for user:", user_email)
                    return Response({'error': 'Company not found'}, status=404)
                company_id = company.id
            if is_employee:
                employee_instance = get_employee_by_email(user_email)
                if not employee_instance:
                    print("ERROR: Employee not found for email:", user_email)
                    return Response({'error': 'Employee not found'}, status=404)
                role_id = employee_instance.role_id
                company_id = employee_instance.company_id

            # --- CASE 1: Specific Employee ---
            if pk:
                employee = Employee.objects.filter(
                    id=pk, company_id=company_id, active=True
                ).select_related('role', 'company').first()

                if not employee:
                    print(f"ERROR: Employee with ID={pk} not found for company ID={company_id}")
                    return Response({'error': 'Employee not found'}, status=404)

                data = EmployeeSerializer(employee).data
                return Response(data, status=200)

            # --- CASE 2: Company/HR/Admin fetching all employees ---
            if is_company or role_id in [1, 2]:

                employees = Employee.objects.filter(
                    company_id=company_id, active=True
                ).select_related('role', 'company') \
                .annotate(
                    username=Concat(F('first_name'), Value(' '), F('last_name'), output_field=CharField()),
                    role_name=F('role__role_name'),
                    company_name=F('company__company_name'), 
                    team_size=F('company__team_size')         
                ).values(
                    'id', 'username', 'contact_number', 'company_email', 'personal_email',
                    'date_of_birth', 'gender', 'company_name', 'team_size', 'role_name'
                ).order_by('-id')

                employees_list = list(employees) 
                return Response(employees_list, status=200)

            # --- CASE 3: Regular Employee accessing own data ---
            if is_employee:
                employee_data = EmployeeSerializer(employee_instance).data
                return Response(employee_data, status=200)

            # Unauthorized fallback
            print("ERROR: Unauthorized access by user:", user_email)
            return Response({'error': 'Unauthorized'}, status=401)

        except Exception as e:
            print("EXCEPTION: An error occurred in Employee GET:", str(e))
            return Response({'error': str(e)}, status=500)

    def post(self, request):
        try:
            data = request.data.copy()
            print('data coming from frontend ==<<>>', data)

            # Flags
            is_company = False
            is_employee = False 

            # Get current user
            user_data = User.objects.get(email=request.user.email)
            is_company = user_data.is_company
            is_employee = user_data.is_employee

            # Required fields check
            required_fields = [
                'first_name', 'last_name', 'company_email', 'personal_email',
                'contact_number', 'date_of_birth', 'gender'
            ]
            missing_fields = [f for f in required_fields if not data.get(f)]
            if missing_fields:
                return Response({'error': f'Missing required fields: {", ".join(missing_fields)}'}, status=400)

            # Determine company
            user_email = request.user.email
            company = None
            company_id = None

            if is_company:
                company = get_company_by_email(user_email)
                company_id = company.id
            elif is_employee:
                emp_data = get_employee_by_email(user_email)
                company = emp_data.company   # ✅ Ensure company is defined
                company_id = company.id
            else:
                return Response({'error': 'Unauthorized to create employees.'}, status=403)

            # Role validation
            role_input = data.get('job_role') or data.get('designation') or data.get('role')
            if not role_input:
                return Response({'error': 'Role is required.'}, status=400)

            try:
                role = Role.objects.get(id=int(role_input)) if str(role_input).isdigit() else Role.objects.get(role_name=role_input.strip())
            except Role.DoesNotExist:
                return Response({'error': f'Role "{role_input}" does not exist.'}, status=400)

            # Optional: Team size limit
            if hasattr(role, 'team_size') and isinstance(role.team_size, int):
                current_count = Employee.objects.filter(role_id=role.id, company_id=company_id).count()
                if current_count >= role.team_size:
                    return Response({'error': f'Team size limit ({role.team_size}) reached for this role.'}, status=400)

            email = data.get('company_email')
            default_password = "Pass@123"

            # Check if user already exists
            user = get_user_by_email(email)
            if not user:
                user = User.objects.create_user(
                    username=data.get('first_name'),
                    email=email,
                    password=default_password,
                    first_name=data.get('first_name', ''),
                    last_name=data.get('last_name', ''),
                    is_employee=True
                )

            # Prevent duplicate employee
            if Employee.objects.filter(company_email=email).exists():
                return Response({'error': 'Employee with this email already exists.'}, status=400)

            # Create employee
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
                company_id=company.id,
            )

            # Send onboarding email
            subject = f"Welcome to {company.company_name} Employee Management System"
            message = (
                f"Hi {employee.first_name} {employee.last_name},\n\n"
                f"Your account has been created.\n"
                f"🔗 Login: http://localhost:5173/login\n"
                f"📧 Email: {email}\n🔐 Password: {default_password}\n\n"
                f"Please change your password after logging in.\n\n"
                f"- {company.company_name} HR Team"
            )
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])

            return Response({'success': 'Employee created and email sent.'}, status=201)

        except Exception as e:
            return Response({'error': f'Employee creation failed: {str(e)}'}, status=400)

    def put(self, request, pk=None):
        try:
            employee = get_object_or_404(Employee, id=pk)

            updatable_fields = ['first_name', 'middle_name', 'last_name', 'contact_number',
                                'company_email', 'personal_email', 'date_of_birth', 'gender', 'job_role']
            for field in updatable_fields:
                value = request.data.get(field)
                if value:
                    setattr(employee, 'role_id' if field == 'job_role' else field, value)

            employee.save()
            return Response({'message': 'Employee updated successfully!', 'id': employee.id}, status=200)

        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    def delete(self, request, pk=None):
        try:
            employee = get_object_or_404(Employee, pk=pk)
            employee.active = False
            employee.save()
            return Response({'success': 'Employee deactivated.'}, status=200)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

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
            print('data comm')
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

    def put(self, request, pk=None):
        try:
            print('data coming from frontend ==<<<<>>', request.data)
            print('FILES coming from frontend ==<<<<>>', request.FILES)
            bank_details = BankDetails.objects.get(pk=pk)  # <-- fix here
        except BankDetails.DoesNotExist:
            return Response({'error': 'Bank details not found for the given ID'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        if 'active' in data:
            data['active'] = True
        data.pop('id', None)
        data.pop('employee', None)

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
            # Get employee linked to logged-in user email
            employee = Employee.objects.get(company_email=request.user.email)

            # Make mutable copy of data and add extra fields
            data = request.data.copy()
            data['active'] = True
            data['employee'] = employee.id

            print('data coming from frontend ==<<>>', data)
            print('files coming from frontend ==<<<>', request.FILES)

            # Merge request.data and request.FILES properly for serializer
            combined_data = data.copy()
            combined_data.update(request.FILES)

            serializer = EmployeeDocumentSerializer(data=combined_data, context={'request': request})

            if serializer.is_valid():
                serializer.save()
                return Response({'success': 'Employee document uploaded successfully.'}, status=status.HTTP_201_CREATED)
            else:
                print('Serializer errors:', serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# update an existing document of an employee
    def put(self, request, pk):
        try:
            print('data coming from frontend ==<<<<>>', request.data)
            print('FILES coming from frontend ==<<<<>>', request.FILES)
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
        


    def post(self, request, pk=None):
        try:
            # Get employee either by pk or logged-in user email
            if pk:
                employee = Employee.objects.get(id=pk)
            else:
                employee = Employee.objects.get(company_email=request.user.email)

            # Check if office details exist for this employee
            try:
                office_details = OfficeDetails.objects.get(employee=employee)
                # Update existing office details
                serializer = EmployeeOfficeDetailsSerializer(
                    office_details,
                    data=request.data,
                    partial=True
                )
            except OfficeDetails.DoesNotExist:
                # Create new office details linked to employee
                data = request.data.copy()
                data['employee'] = employee.id
                serializer = EmployeeOfficeDetailsSerializer(data=data)

            if serializer.is_valid():
                serializer.save(active=True)
                return Response(
                    {'success': 'Employee office details saved successfully.'},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # def post(self, request):
    #     try:
    #         employee = Employee.objects.get(company_email=request.user.email)
    #         data = request.data.copy()
    #         data['active'] = True

    #         data['employee'] = employee.id 

    #         serializer = EmployeeOfficeDetailsSerializer(data=data)
    #         if serializer.is_valid():
    #             serializer.save()
    #             return Response({'success': 'Employee office details created successfully.'}, status=status.HTTP_201_CREATED)

    #         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    #     except Employee.DoesNotExist:
    #         return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
    #     except Exception as e:
    #         return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    # def put(self, request, pk):
    #     try:
    #         employee_office_details = OfficeDetails.objects.get(employee_id=pk)
    #     except OfficeDetails.DoesNotExist:
    #         return Response({'error': 'Employee office details not found for the given ID'}, status=status.HTTP_404_NOT_FOUND)

    #     data = request.data.copy()
    #     data['active'] = True
    #     data.pop('id', None)
    #     data.pop('employee', None)

    #     serializer = EmployeeOfficeDetailsSerializer(employee_office_details, data=data, partial=True)
    #     if serializer.is_valid():
    #         serializer.save()
    #         return Response(serializer.data, status=status.HTTP_200_OK)

    #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

# Profile Image Upload View
class ProfileImageUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print('Requesting user email:', request.user.email)
        image = request.FILES.get('image')
        print('image==<<<>>', image)
        if not image:
            return Response({"error": "No image provided."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = request.user
            is_comapany = user.is_company
            if(user.is_company):
                companay = Company.objects.get(email=request.user.email)
                companay.profile_image = image
                companay.save()

                return Response({"message": "Profile image uploaded successfully."}, status=status.HTTP_200_OK)


            employee = Employee.objects.get(company_email=request.user.email)
            employee.profile_image = image

            employee.save()

            return Response({"message": "Profile image uploaded successfully."}, status=status.HTTP_200_OK)

        except Employee.DoesNotExist:
            print("Employee not found for the user.")
            return Response({"error": "Employee not found."}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            return Response({"error": "Something went wrong."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
# Employee Form Views for detailed employee information
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
        
# Current Employee View
class CurrentEmployeeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            user_email = user.email

            # Check if the user is an employee
            if user.is_employee:
                employee = Employee.objects.filter(company_email=user_email).first()
                if not employee:
                    return Response({'error': 'Employee record not found'}, status=status.HTTP_404_NOT_FOUND)
                serializer = EmployeeSerializer(employee)
                return Response(serializer.data, status=status.HTTP_200_OK)

            # Check if the user is a company
            elif user.is_company:
                company = Company.objects.filter(email=user_email).first()
                if not company:
                    return Response({'error': 'Company record not found'}, status=status.HTTP_404_NOT_FOUND)
                serializer = CompanySerializer(company)  
                return Response(serializer.data, status=status.HTTP_200_OK)

            else:
                return Response({'error': 'Unauthorized user type'}, status=status.HTTP_403_FORBIDDEN)

        except Exception as e:
            print(f"[CurrentEmployeeView Error]: {str(e)}")
            return Response({'error': 'Something went wrong', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Employee Profile ViewSet
class EmployeeProfileViewSet(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Fetch employee details
            is_company = False
            is_employee = False
            is_superuser = False
            user_data = User.objects.filter(email=request.user.email).first()
            is_company = user_data.is_company
            is_employee = user_data.is_employee
            if(is_company):
                company = Company.objects.get(email=request.user.email)
                print('Company details:', company)
                return Response(CompanySerializer(company).data, status=status.HTTP_200_OK)
          
            employee = Employee.objects.get(company_email=request.user.email)
            role_name = Role.objects.get(id=employee.role_id).role_name
            print('role_name ==<<<>>', role_name)

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

