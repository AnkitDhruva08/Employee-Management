from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from core.models import Employee, Role, Company, NomineeDetails, BankDetails, OfficeDetails, EmployeeDocument, EmergencyContact
from core.serializers import EmployeeDocumentSerializer, EmployeeSerializer, BankDetailsSerializer,NomineeDetailsSerializer, EmergencyContactSerializer, EmployeeOfficeDetailsSerializer
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

User = get_user_model()


# Employee ModelViewSet for Employee CRUD operations

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        username = request.user
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
            # 5. Create NomineeDetails
            return Response({'success': 'Employee created successfully.'}, status=status.HTTP_201_CREATED)
        except Exception as e:
                return Response({'error': f'Employee creation failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST) 



# Employee Bank Details CRUD operations
class EmployeeBankDetailsView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        try:
            employee = Employee.objects.get(first_name=request.user.first_name)
            bank_details = BankDetails.objects.filter(employee=employee)
            serializer = BankDetailsSerializer(bank_details, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        try:
            employee = Employee.objects.get(first_name=request.user.first_name)
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

    def put(self, request, pk):
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
            employee = Employee.objects.get(first_name=request.user.first_name)
            nominee_details = NomineeDetails.objects.filter(employee=employee)
            serializer = NomineeDetailsSerializer(nominee_details, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def post(self, request):
        try:
            employee = Employee.objects.get(first_name=request.user.first_name)
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
        data.pop('id', None)
        data.pop('employee', None)

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
            employee = Employee.objects.get(first_name=request.user.first_name)
            employee_documents = EmployeeDocument.objects.filter(employee=employee)
            serializer = EmployeeDocumentSerializer(employee_documents, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

# post a new document of an employee
    def post(self, request):
        try:
            employee = Employee.objects.get(first_name=request.user.first_name)
            
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
            employee = Employee.objects.get(first_name=request.user.first_name)
            emergency_contacts = EmergencyContact.objects.filter(employee=employee)
            serializer = EmergencyContactSerializer(emergency_contacts, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def post(self, request):
        try:
            print('data coming from  frontend', request.data)
            employee = Employee.objects.get(first_name=request.user.first_name)
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
            print('data coming from  frontend', request.data)
            emergency_contact = EmergencyContact.objects.get(pk=pk)
        except EmergencyContact.DoesNotExist:
            return Response({'error': 'Emergency contact not found for the given ID'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data.pop('id', None)
        data.pop('employee', None)

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
            employee = Employee.objects.get(first_name=request.user.first_name)
            office_details = OfficeDetails.objects.filter(employee=employee)
            serializer = EmployeeOfficeDetailsSerializer(office_details, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def post(self, request):
        try:
            print('data coming from  frontend', request.data)
            employee = Employee.objects.get(first_name=request.user.first_name)
            print('employee', employee)
            data = request.data.copy()
            data['employee'] = employee.id 
            print('data after employee', employee.id)

            serializer = EmployeeOfficeDetailsSerializer(data=data)
            print('serializer', serializer)
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
    
    