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
            if not is_company:
                try:
                    employee = Employee.objects.get(company_email=email)
                    role_id = employee.role_id
                    emp_id = employee.id
                except Employee.DoesNotExist:
                    return Response({'error': 'Employee not found'}, status=404)

            data = get_leave_requests(is_company, role_id, emp_id)
            print("Leave requests data:", data)
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
            user = request.user
            employee = Employee.objects.get(first_name=user)
            data['employee'] = employee.id 

            # Handle 'Single day' case
            if data.get('duration') == 'Single day':
                data['to_date'] = data.get('from_date')

            # If to_date is empty, remove it
            if not data.get('to_date'):
                data.pop('to_date', None)

            # Now serialize the data
            serializer = LeaveRequestSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response({'success': 'Leave request created successfully.'}, status=status.HTTP_201_CREATED)
            else:
                print('serializer errors:', serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        

    def put(self, request, pk, *args, **kwargs):
        try:
            leave_request = LeaveRequest.objects.get(pk=pk)
            data = request.data.copy()  # Make a mutable copy
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

        

