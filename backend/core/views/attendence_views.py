from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from core.models import Attendance, AttendanceSession, User, Company, Employee
from core.serializers import AttendanceSerializer, AttendanceSessionSerializer
from core.utils.filter_utils import apply_common_filters


class AttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        email = request.user.email
        print('Requesting user email:', email)
        user_name = ''
        role_id = None
        employee_id = None

        try:
            user_data = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return Response({'error': 'User not found or inactive.'}, status=404)

        # Determine company_id and employee details
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
                role_id = employee.role_id
                employee_id = employee.id
            except Employee.DoesNotExist:
                return Response({'error': 'Employee not found or inactive.'}, status=404)

        if not company_id:
            return Response({'error': 'Company ID could not be determined.'}, status=400)

        print('Resolved company_id:', company_id)
        print('role_id ==<<>', role_id)

        # Build the base queryset
        attendance_queryset = Attendance.objects.filter(company_id=company_id).select_related('employee')

        # If not company user and not admin/manager, restrict to own attendance only
        if not user_data.is_company and role_id not in [1, 2]:
            attendance_queryset = attendance_queryset.filter(employee_id=employee_id)

        # Apply additional filters (like month/year from request)
        attendance_queryset = apply_common_filters(attendance_queryset, request)

        # Build attendance data response
        attendance_data = []
        for record in attendance_queryset:
            employee = record.employee
            if employee and employee.active:
                user_name = f"{employee.first_name} {employee.last_name}"
                attendance_data.append({
                    "attendance_id": record.id,
                    "employee_id": employee.id,
                    "user_name": user_name,
                    "date": record.date,
                    "check_in": record.check_in,
                    "check_out": record.check_out,
                    "status": record.status,
                })
                print(f"User: {user_name}, Date: {record.date}, Status: {record.status}")

        if not attendance_data:
            return Response({'message': 'No attendance data found.'}, status=200)

        return Response({'data': attendance_data}, status=200)