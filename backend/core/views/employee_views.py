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

User = get_user_model()




# Employee Dashboard Links

class EmployeeDashboardViewSet(viewsets.ModelViewSet):
    queryset = EmployeeDashboardLink.objects.all().order_by('id')
    serializer_class = EmployeeDashboardLinkSerializer
    permission_classes = [IsAuthenticated]

# Employee ModelViewSet for Employee CRUD operations
class EmployeeViewSet(APIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk=None, *args, **kwargs):
        try:
            company = Company.objects.filter(email=request.user.email).first()
            employee_user = Employee.objects.filter(company_email=request.user.email).first()

            if not company and not employee_user:
                return Response({'error': 'Unauthorized access.'}, status=status.HTTP_401_UNAUTHORIZED)

            if company:
                company_user = company.user
            elif employee_user and employee_user.role_id == 2:
                company_user = employee_user.company
            else:
                return Response({'error': 'Unauthorized access.'}, status=status.HTTP_401_UNAUTHORIZED)

            # Filter all active employees from the determined company
            employees_query = Employee.objects.filter(company=company_user, active=True)

            if pk:
                # Fetch specific employee details
                employee = employees_query.filter(id=pk).values(
                    'id',
                    'first_name',
                    'middle_name',
                    'last_name',
                    'contact_number',
                    'company_email',
                    'personal_email',
                    'date_of_birth',
                    'gender',
                    'role_id'
                ).first()

                if employee:
                    return Response(employee)
                else:
                    return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

            # Fetch all employees with annotations
            employees = employees_query.select_related('role', 'company') \
                .annotate(
                    username=Concat(F('first_name'), Value(' '), F('last_name'), output_field=CharField()),
                    role_name=F('role__role_name'),
                    company_name=F('company__company__company_name')
                ) \
                .values(
                    'id',
                    'username',
                    'contact_number',
                    'company_email',
                    'personal_email',
                    'date_of_birth',
                    'gender',
                    'company_name',
                    'role_name'
                ).order_by('-id')

            return Response(employees)

        except Exception as e:
            print('Error:', e)
            return Response({'error': 'Something went wrong'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


        
    def post(self, request, *args, **kwargs):
        data = request.data.copy()
        username = request.user
        try:
            company_id = Company.objects.get(company_name=request.user).id
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
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            try:
                user = User.objects.create_user(
                    username=data.get('first_name'),
                    email=email,
                    password="Pass@123",
                    first_name=data.get('first_name', ''),
                    last_name=data.get('last_name', ''),
                    is_employee=True
                )
            except Exception as e:
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
            return Response({'success': 'Employee created successfully.'}, status=status.HTTP_201_CREATED)
        except Exception as e:
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
            bank_details = BankDetails.objects.get(pk=pk)
        except BankDetails.DoesNotExist:
            return Response({'error': 'Bank details not found for the given ID'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
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
    def get(self, request):
        try:
            employee = Employee.objects.get(company_email=request.user.email)
            nominee_details = NomineeDetails.objects.filter(employee=employee)
            serializer = NomineeDetailsSerializer(nominee_details, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def post(self, request):
        try:
            employee = Employee.objects.get(company_email=request.user.email)
            data = request.data.copy()
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
            nominee_details = NomineeDetails.objects.get(pk=pk)
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
        if 'active' in data:
            data['active'] = data['active'].lower() == 'true'

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
    def get(self, request):
        try:
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
            employee_document = EmployeeDocument.objects.get(pk=pk)
            data = request.data.copy()
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
    def get(self, request):
        try:
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
            emergency_contact = EmergencyContact.objects.get(pk=pk)
        except EmergencyContact.DoesNotExist:
            return Response({'error': 'Emergency contact not found for the given ID'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()

        # Remove fields that shouldn't be updated
        for field in ['id', 'employee', 'created_at', 'updated_at']:
            data.pop(field, None)

        # Handle "null" strings
        for field in ['created_by', 'updated_by']:
            if data.get(field) == 'null':
                data.pop(field)

        # Convert "true"/"false" to boolean
        if 'active' in data:
            data['active'] = data['active'].lower() == 'true'

        serializer = EmergencyContactSerializer(emergency_contact, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

# Employee Offices  Details CRUD operations
class EmployeeOfficeDetailsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
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
            employee_office_details = OfficeDetails.objects.get(pk=pk)
        except OfficeDetails.DoesNotExist:
            return Response({'error': 'Employee office details not found for the given ID'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data.pop('id', None)
        data.pop('employee', None)

        serializer = EmployeeOfficeDetailsSerializer(employee_office_details, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    