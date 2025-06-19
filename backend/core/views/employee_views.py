import json
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
from core.utils.kafka_producer import send_to_kafka  
from datetime import datetime
from core.async_task.tasks import send_welcome_email_task, send_generic_email_task
User = get_user_model()

def to_bool(value):
    return str(value).lower() == 'true'







# Employee ModelViewSet for Employee CRUD operations
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import F, Value, CharField
from django.db.models.functions import Concat
from django.utils.timezone import now as datetime
from django.conf import settings




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

            if pk:
                employee = Employee.objects.filter(
                    id=pk, company_id=company_id, active=True
                ).select_related('role', 'company').first()

                if not employee:
                    return Response({'error': 'Employee not found'}, status=404)

                data = EmployeeSerializer(employee).data
                return Response(data, status=200)

            if is_company or role_id in [1, 2, 3]:
                employees = Employee.objects.filter(
                    company_id=company_id
                ).select_related('role', 'company').annotate(
                    username=Concat(F('first_name'), Value(' '), F('last_name'), output_field=CharField()),
                    role_name=F('role__role_name'),
                    company_name=F('company__company_name'),
                    team_size=F('company__team_size')
                ).values(
                    'id', 'username', 'contact_number', 'company_email', 'personal_email',
                    'date_of_birth', 'gender', 'company_name', 'team_size', 'role_name', 'active'
                ).order_by('-id')

                return Response(list(employees), status=200)

            if is_employee:
                return Response(EmployeeSerializer(employee_instance).data, status=200)

            return Response({'error': 'Unauthorized'}, status=401)

        except Exception as e:
            print("EXCEPTION: An error occurred in Employee GET:", str(e))
            return Response({'error': str(e)}, status=500)

    def post(self, request):
        try:
            data = request.data.copy()
            user_data = User.objects.get(email=request.user.email)
            is_company = user_data.is_company
            is_employee = user_data.is_employee

            required_fields = ['first_name', 'last_name', 'company_email', 'personal_email',
                               'contact_number', 'date_of_birth', 'gender']
            missing_fields = [f for f in required_fields if not data.get(f)]
            if missing_fields:
                return Response({'error': f'Missing required fields: {", ".join(missing_fields)}'}, status=400)

            if is_company:
                company = get_company_by_email(request.user.email)
            elif is_employee:
                emp_data = get_employee_by_email(request.user.email)
                company = emp_data.company
            else:
                return Response({'error': 'Unauthorized to create employees.'}, status=403)

            company_id = company.id

            role_input = data.get('job_role') or data.get('designation') or data.get('role')
            if not role_input:
                return Response({'error': 'Role is required.'}, status=400)

            try:
                role = Role.objects.get(id=int(role_input)) if str(role_input).isdigit() else Role.objects.get(role_name=role_input.strip())
            except Role.DoesNotExist:
                return Response({'error': f'Role "{role_input}" does not exist.'}, status=400)

            # Check if company has reached team size limit
            if company.team_size and str(company.team_size).isdigit():
                current_team_size = Employee.objects.filter(company_id=company.id, active=True).count()
                if current_team_size >= int(company.team_size):
                    return Response({'error': f'Team size limit ({company.team_size}) reached for this company.'}, status=400)


            email = data.get('company_email')
            default_password = "Pass@123"

            if User.objects.filter(email=email).exists():
                return Response({'error': 'Employee with this email already exists.'}, status=400)
            if Employee.objects.filter(contact_number=data.get('contact_number')).exists():
                return Response({'error': 'Employee with this contact number already exists.'}, status=400)

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
                user_id=user.id,
            )

            subject = f"Welcome to {company.company_name} Employee Management System"
            message = (
                f"Hi {employee.first_name} {employee.last_name},\n\n"
                f"Your account has been created.\n"
                f"🔗 Login: http://localhost:5173/login\n"
                f"📧 Email: {email}\n🔐 Password: {default_password}\n\n"
                f"Please change your password after logging in.\n\n"
                f"- {company.company_name} HR Team"
            )
            send_welcome_email_task.delay(subject, message, email)

            return Response({'success': 'Employee created and email sent.'}, status=201)

        except Exception as e:
            return Response({'error': f'Employee creation failed: {str(e)}'}, status=400)

    def put(self, request, pk=None):
        try:
            employee = get_object_or_404(Employee, id=pk)
            updatable_fields = [
                'first_name', 'middle_name', 'last_name', 'contact_number',
                'company_email', 'personal_email', 'date_of_birth', 'gender', 'job_role'
            ]

            updated_fields = {}
            changes_summary = []

            for field in updatable_fields:
                value = request.data.get(field)
                if value:
                    old_value = getattr(employee, field if field != 'job_role' else 'role_id', None)

                    if field == 'job_role':
                        role = Role.objects.get(id=int(value))
                        if employee.role_id != role.id:
                            employee.role_id = role.id
                            updated_fields['role'] = role.role_name
                            changes_summary.append(f"Role changed to: {role.role_name}")
                    else:
                        if str(old_value) != str(value):  # Compare string values to avoid false positives
                            setattr(employee, field, value)
                            updated_fields[field] = value
                            changes_summary.append(f"{field.replace('_', ' ').title()} changed to: {value}")

            if not updated_fields:
                return Response({'message': 'No changes detected.'}, status=200)

            employee.save()

            # Compose the email
            subject = f"Profile Update Notification - {employee.first_name} {employee.last_name}"
            message = (
                f"Hi {employee.first_name},\n\n"
                f"Your profile was updated .\n\n"
                f"The following changes were made:\n"
                f"{chr(10).join(['- ' + change for change in changes_summary])}\n\n"
                f"If you did not request these changes, please contact HR immediately.\n\n"
                f"- HR Team"
            )

            # Send update email via Celery
            print('subject ==<<>>>', subject)
            print('message ==<<<>>', message)
            print('employee.company_email ==<<>>', employee.company_email)
            send_welcome_email_task.delay(subject, message, employee.company_email)

            return Response({'message': 'Employee updated successfully!', 'id': employee.id}, status=200)

        except Role.DoesNotExist:
            return Response({'error': 'Invalid role specified.'}, status=400)
        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found.'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    


    def delete(self, request, pk=None):
        try:
            employee = get_object_or_404(Employee, pk=pk)
            user_data = User.objects.get(id=employee.user_id)
            user_data.is_active = False
            employee.active = False
            employee.save()
            user_data.save()

            print('employee.company_email', employee.company_email)
            # Send deactivation email
            subject = f"Your account has been deactivated"
            message = (
                f"Hi {employee.first_name},\n\n"
                f"Your employee account has been deactivated as of {datetime().strftime('%Y-%m-%d %H:%M:%S')}.\n"
                f"Please contact HR for more information.\n\n"
                f"- HR Team"
            )
            send_welcome_email_task.delay(subject, message, employee.company_email)

            return Response({'success': 'Employee deactivated.'}, status=200)

        except Exception as e:
            return Response({'error': str(e)}, status=500)

    def patch(self, request, pk=None):
        try:
            employee = Employee.objects.get(id=pk)
            user = get_object_or_404(User, id=employee.user_id)

            new_status = request.data.get('active')
            if new_status is None:
                return Response({'error': 'Missing active status'}, status=400)

            # Convert string "true"/"false" to boolean if needed
            if isinstance(new_status, str):
                new_status = new_status.lower() == 'true'

            employee.active = new_status
            user.is_active = new_status
            employee.save()
            user.save()

            # Get company for email message
            company = Company.objects.get(id=employee.company_id)
            status_text = "activated" if new_status else "deactivated"
            default_password = "Pass@123"  

            subject = f"Your account has been {status_text}"

            if new_status:
                print('ankit ')
                message = (
                    f"Hi {employee.first_name} {employee.last_name},\n\n"
                    f"Your account has been {status_text} .\n"
                    f"🔗 Login: http://localhost:5173/login\n"
                    f"📧 Email: {employee.company_email}\n🔐 Password: {default_password}\n\n"
                    f"Please change your password after logging in.\n\n"
                    f"If you have any questions, please contact HR.\n\n"
                    f"- {company.company_name} HR Team"
                )
            else:
                message = (
                    f"Hi {employee.first_name} {employee.last_name},\n\n"
                    f"Your account has been {status_text} .\n\n"
                    f"If you have any questions, please contact HR.\n\n"
                    f"- {company.company_name} HR Team"
                )

            # Send activation/deactivation email
            email = employee.company_email
            send_welcome_email_task.delay(subject, message, email)

            return Response({'success': f"Employee {status_text}."}, status=200)

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
            employee = Employee.objects.get(company_email=request.user.email)
            data = request.data.copy()
            data['active'] = True
            data['employee'] = employee.id
            account_number = data.get('account_number')
            # Check if bank details already exist for this employee
            if BankDetails.objects.filter(employee=employee).exists():
                return Response({'error': 'Bank details already exist for this employee.'},
                                status=status.HTTP_400_BAD_REQUEST)
            if BankDetails.objects.filter(account_number=account_number).exists():
                return Response({'error': 'Bank details with account number already exist'},status=status.HTTP_400_BAD_REQUEST)

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
                bank_details = BankDetails.objects.get(pk=pk)
               
            except BankDetails.DoesNotExist:
                return Response(
                    {'error': 'Bank details not found for the given ID'},
                    status=status.HTTP_404_NOT_FOUND
                )

            data = request.data.copy()

            if 'active' in data:
                data['active'] = True  #

            # Prevent overwriting protected fields
            for field in ['id', 'employee']:
                data.pop(field, None)

            # Include uploaded files
            data.update(request.FILES)

            account_number = data.get('account_number')

            # Only check uniqueness if account_number is changing
            if account_number and account_number != bank_details.account_number:
                exists = BankDetails.objects.filter(account_number=account_number).exclude(pk=pk).exists()
                if exists:
                    return Response(
                        {'error': 'Another bank detail with this account number already exists.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            serializer = BankDetailsSerializer(bank_details, data=data, partial=True)

            if serializer.is_valid():
                serializer.save()
                return Response(
                    {
                        'message': 'Bank details updated successfully.',
                        'data': serializer.data
                    },
                    status=status.HTTP_200_OK
                )

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
            combined_data = data.copy()
            combined_data.update(request.FILES)

            # Duplicate check
            for field in ['uan', 'epf_member', 'insurance_number']:
                value = combined_data.get(field)
                if value and EmployeeDocument.objects.filter(**{field: value}).exists():
                    return Response(
                        {f'error': f'{field.replace("_", " ").title()} already exists.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            serializer = EmployeeDocumentSerializer(data=combined_data, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response({'success': 'Employee document uploaded successfully.'}, status=status.HTTP_201_CREATED)
            else:
                first_field = next(iter(serializer.errors))
                # Get the first error message for that field
                first_error = serializer.errors[first_field][0]

                # Log (optional)
                print("Validation Error:", first_error)

                return Response({'error' : first_error}, status=status.HTTP_400_BAD_REQUEST)

        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        try:
            employee_document = EmployeeDocument.objects.get(employee_id=pk)

            data = request.data.copy()
            data['active'] = True
            data.update(request.FILES)

            # Duplicate check (excluding the current instance)
            for field in ['uan', 'epf_member', 'insurance_number']:
                value = data.get(field)
                if value and EmployeeDocument.objects.filter(**{field: value}).exclude(pk=employee_document.pk).exists():
                    return Response(
                        {f'error': f'{field.replace("_", " ").title()} already exists for another employee.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            serializer = EmployeeDocumentSerializer(employee_document, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({'success': 'Employee document updated successfully.'}, status=status.HTTP_200_OK)
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
        image = request.FILES.get('image')
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
                return Response(CompanySerializer(company).data, status=status.HTTP_200_OK)
          
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

