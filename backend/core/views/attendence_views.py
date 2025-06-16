from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from core.models import Attendance, AttendanceSession, User, Company, Employee
from core.serializers import AttendanceSerializer, AttendanceSessionSerializer

class AttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        email = request.user.email
        print('Requesting user email:', email)

        try:
            user_data = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return Response({'error': 'User not found or inactive.'}, status=404)

        # Determine company_id based on user role
        company_id = None
        if user_data.is_company:
            try:
                company = Company.objects.get(user_id=user_data.id, active=True)
                company_id = company.id
            except Company.DoesNotExist:
                return Response({'error': 'Company not found or inactive.'}, status=404)

        elif user_data.is_employee:
            try:
                employee = Employee.objects.get(user_id=user_data.id, active=True)
                company_id = employee.company_id
            except Employee.DoesNotExist:
                return Response({'error': 'Employee not found or inactive.'}, status=404)

        if not company_id:
            return Response({'error': 'Company ID could not be determined.'}, status=400)

        print('Resolved company_id:', company_id)

        # Fetch attendance data for this company
        attendance_records = Attendance.objects.filter(company_id=company_id)

        if not attendance_records.exists():
            return Response({'error': 'No attendance data found for this company.'}, status=404)

        serializer = AttendanceSerializer(attendance_records, many=True)
        return Response({'data': serializer.data}, status=200)