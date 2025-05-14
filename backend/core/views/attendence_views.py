from rest_framework.generics import ListAPIView
from core.utils.utils import is_profile_complete
from core.models import Attendance, Company, Employee
from core.serializers import AttendanceSerializer
from rest_framework.permissions import IsAuthenticated
from django.db.models import OuterRef, Subquery, Q, Value, F, ExpressionWrapper, FloatField, CharField
from django.db.models.functions import ExtractSecond, ExtractMinute, ExtractHour, Concat, Coalesce
from rest_framework.response import Response
from django.utils.timezone import now
from datetime import date
from django.contrib.auth import get_user_model



User = get_user_model()

from calendar import monthrange

class AttendanceView(ListAPIView):
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        email = request.user.email
        today = date.today()
        month = int(request.query_params.get('month', today.month))
        year = int(request.query_params.get('year', today.year))

        start_date = date(year, month, 1)
        end_date = date(year, month, monthrange(year, month)[1])

        # Check user role
        is_company = Company.objects.filter(email=email).exists()
        if not is_company:
            try:
                employee = Employee.objects.get(company_email=email)
            except Employee.DoesNotExist:
                return Response({'error': 'Employee not found'}, status=404)

            # Optionally restrict to only that employee’s attendance
            attendance_qs = Attendance.objects.filter(user=request.user, date__range=(start_date, end_date))
        else:
            attendance_qs = Attendance.objects.filter(date__range=(start_date, end_date))

        # Optional filters:
        employee_id = request.query_params.get('employee_id')
        if employee_id:
            attendance_qs = attendance_qs.filter(user_id=employee_id)

        attendance_data = attendance_qs.values(
            'user_id', 'user__username', 'date',
            'login_time', 'logout_time', 'status'
        ).order_by('user_id', 'date')

        # Optional: group by user and calculate working days
        report = {}
        for entry in attendance_data:
            uid = entry['user_id']
            user = entry['user__username']
            if uid not in report:
                report[uid] = {
                    'employee': user,
                    'days': []
                }

            duration = None
            if entry['login_time'] and entry['logout_time']:
                duration = (entry['logout_time'] - entry['login_time']).total_seconds() / 3600.0

            report[uid]['days'].append({
                'date': entry['date'],
                'login_time': entry['login_time'],
                'logout_time': entry['logout_time'],
                'status': entry['status'],
                'hours_worked': round(duration, 2) if duration else 0.0
            })

        return Response({
            'month': month,
            'year': year,
            'attendance': list(report.values())
        }, status=200)

        

