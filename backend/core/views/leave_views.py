from core.models import LeaveRequest, LeaveBalance, Employee, Company
from core.serializers import LeaveRequestSerializer
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import F, Value, CharField
from django.db.models.functions import Concat
from core.utils.leave_utils import get_leave_requests
from core.utils.utils import is_profile_complete

class LeaveRequestViewSet(APIView):
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
        
    def get(self, request):
        try:
            email = request.user.email
            is_company = Company.objects.filter(email=email).exists()
            role_id = None
            emp_id = None
            company_id = None
            if not is_company:
                try:
                    employee = Employee.objects.get(company_email=email)
                    role_id = employee.role_id
                    emp_id = employee.id
                    company_id = employee.company_id
                except Employee.DoesNotExist:
                    return Response({'error': 'Employee not found'}, status=404)
                
            if(is_company):
                company_data = Company.objects.get(email = request.user.email)
                print('company_data ===<<<>>', company_data)
                company_id = company_data.id
                print('company_id ==<<<>>', company_id)


            data = get_leave_requests(is_company, role_id, emp_id, company_id)
            if data.get('success') is False:
                return Response({
                    "is_complete": data.get('is_complete', False),
                    "message": data.get('message', 'Profile incomplete.'),
                    "missing_sections": data.get('missing_sections', None),
                    "data": None
                }, status=200)

            return Response(data, status=200)

        except Exception as e:
            return Response({'error': str(e)}, status=500)


    def post(self, request, *args, **kwargs):
        try:
            data = request.data.copy()
            print('data ==<<<>>', data)
            user = request.user

            employee = Employee.objects.get(company_email=request.user.email)
            data['employee'] = employee.id 
            data['company_id'] = employee.company_id
            data['active'] = True

            role_id = employee.role_id

            # Set hr_reviewed and active if role is HR
            if role_id == 2:  # HR
                data['hr_reviewed'] = True
                data['status'] == 'HR Approved'
                

            # Handle 'Single day' case
            if data.get('duration') == 'Single day':
                data['to_date'] = data.get('from_date')

            # Remove empty to_date
            if not data.get('to_date'):
                data.pop('to_date', None)

            print('data after ==<<<<>>', data)

            # Serialize and save
            serializer = LeaveRequestSerializer(data=data)
            print('serializer ==<<<>>>', serializer)

            if serializer.is_valid():
                serializer.save()
                return Response({'success': 'Leave request created successfully.'}, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


    def put(self, request, pk, *args, **kwargs):
        try:
            leave_request = LeaveRequest.objects.get(pk=pk)
            data = request.data.copy()  
            print('data comiing from frontend ==<<<>>', data)
            # Automatically set hr_reviewed = True if status is HR Approved
            if data.get('status') == 'HR Approved':
                data['hr_reviewed'] = True 

            if data.get('status') == 'Admin Approved':
                data['admin_reviewed'] = True 

            serializer = LeaveRequestSerializer(leave_request, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({'success': 'Leave request updated successfully.'}, status=status.HTTP_200_OK)
            else:
                print("Serializer errors:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except LeaveRequest.DoesNotExist:
            return Response({'error': 'Leave request not found'}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            print("Error during update:", str(e))
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        

