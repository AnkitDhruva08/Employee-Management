from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from core.models import Employee, Role, Company, NomineeDetails, BankDetails, OfficeDetails, DocumentUploads
from core.serializers import EmployeeSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.core.exceptions import ObjectDoesNotExist

User = get_user_model()
class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        username = request.user
        print('username ==<<<>>', username)
        company_id = Company.objects.get(company_name=request.user).id

        # 1. Validate role from designation
        role_id = data.get('Designation') or data.get('designation') or data.get('role')
        
        if not role_id:
            return Response({'error': 'Designation (Role) is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Allow both role ID or name
            if str(role_id).isdigit():
                role = Role.objects.get(id=int(role_id))
            else:
                role = Role.objects.get(role_name=role_id.strip())
        except Role.DoesNotExist:
            return Response({'error': f'Role "{role_id}" does not exist.'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Check if User exists
        try:
            email = data.get('company_email')
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # If user does not exist, create one
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

        # 3. Check if Employee already exists for this user
        if Employee.objects.filter(company_email=email).exists():
            return Response({'error': 'Employee with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        # 4. Create Employee

        try:
            employee = Employee.objects.create(
                first_name = data.get('first_name'),
                middle_name=  data.get('middle_name'),
                last_name =  data.get('last_name'),
                contact_number = data.get('contact_number'),
                company_email = data.get('company_email'),
                personal_email = data.get('personal_email'),
                date_of_birth = data.get('date_of_birth'),
                gender = data.get('gender'),
                role_id = role_id, 
                company_id = company_id 

            )
            print('employee ==<<>>', employee)

            return Response({'success': 'Employee created successfully.'}, status=status.HTTP_201_CREATED)
        except Exception as e:
                return Response({'error': f'Employee creation failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST) 


     
