from rest_framework import viewsets
from core.models import LeaveRequest, LeaveBalance, Employee
from core.serializers import LeaveRequestSerializer
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from core.models import LeaveRequest
from core.serializers import LeaveRequestSerializer


class LeaveRequestViewSet(APIView):
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        try:
            employee = Employee.objects.get(company_email=request.user.email)
            leave_details = LeaveRequest.objects.filter(employee=employee)
            serializer = LeaveRequestSerializer(leave_details, many=True)
            print('serializer:', serializer)
            return Response({'data' : serializer.data}, status=status.HTTP_200_OK)

        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)


    def post(self, request, *args, **kwargs):
        try:
            data = request.data.copy()
            user = request.user
            print('user:', user)
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
            print('serializer ===<<<>>', serializer)
            if serializer.is_valid():
                serializer.save()
                return Response({'success': 'Leave request created successfully.'}, status=status.HTTP_201_CREATED)
            else:
                print('serializer errors:', serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

