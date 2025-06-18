from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_datetime
from datetime import timedelta

from core.models import Attendance, AttendanceSession, User, Company, Employee
from core.utils.filter_utils import apply_common_filters


class AttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        email = request.user.email
        role_id = None
        employee_id = None

        try:
            user_data = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return Response({'error': 'User not found or inactive.'}, status=404)

        # Determine company_id
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

        attendance_queryset = Attendance.objects.filter(company_id=company_id).select_related('employee')

        # Restrict to personal records for normal employees
        if not user_data.is_company and role_id not in [1, 2]:
            attendance_queryset = attendance_queryset.filter(employee_id=employee_id)

        # Apply date filters
        attendance_queryset = apply_common_filters(attendance_queryset, request)

        attendance_data = []
        for record in attendance_queryset:
            employee = record.employee
            if not employee or not employee.active:
                continue

            logs = record.time_logs or []
            first_check_in = None
            last_check_out = None
            total_duration = timedelta()

            for log in logs:
                check_in = parse_datetime(log.get("check_in")) if "check_in" in log else None
                check_out = parse_datetime(log.get("check_out")) if "check_out" in log else None

                if check_in and not first_check_in:
                    first_check_in = check_in
                if check_out:
                    last_check_out = check_out
                if check_in and check_out:
                    total_duration += (check_out - check_in)

            user_name = f"{employee.first_name} {employee.last_name}"
            attendance_data.append({
                "attendance_id": record.id,
                "employee_id": employee.id,
                "user_name": user_name,
                "date": record.date,
                "first_check_in": first_check_in,
                "last_check_out": last_check_out,
                "time_logs": logs,
                "total_duration_hours": round(total_duration.total_seconds() / 3600, 2),
                "status": record.status,
            })

        if not attendance_data:
            return Response({'message': 'No attendance data found.'}, status=200)

        return Response({'data': attendance_data}, status=200)
