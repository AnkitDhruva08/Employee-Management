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

class AttendanceView(ListAPIView):
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        today = date.today()
        email = request.user.email

        # Determine if the user is a company
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

            # Check if profile is complete
            data = is_profile_complete(emp_id)
            if not data.get('success', False):
                return Response({
                    "is_complete": data.get('is_complete', False),
                    "message": data.get('message', 'Profile incomplete.'),
                    "missing_sections": data.get('missing_sections'),
                    "data": None
                }, status=200)

        # Attendance subquery for today
        attendance_qs = Attendance.objects.filter(
            user=OuterRef('pk'),
            date=today
        )

        # Annotate users with attendance info
        users_with_attendance = User.objects.annotate(
            login_time=Subquery(attendance_qs.values('login_time')[:1]),
            logout_time=Subquery(attendance_qs.values('logout_time')[:1]),
            date=Subquery(attendance_qs.values('date')[:1]),
            status=Coalesce(
                Subquery(attendance_qs.values('status')[:1]),
                Value('Absent')
            ),
            duration_seconds=ExpressionWrapper(
                ExtractHour(Subquery(attendance_qs.values('logout_time')[:1]) - Subquery(attendance_qs.values('login_time')[:1])) * 3600 +
                ExtractMinute(Subquery(attendance_qs.values('logout_time')[:1]) - Subquery(attendance_qs.values('login_time')[:1])) * 60 +
                ExtractSecond(Subquery(attendance_qs.values('logout_time')[:1]) - Subquery(attendance_qs.values('login_time')[:1])),
                output_field=FloatField()
            )
        ).annotate(
            duration_hours=ExpressionWrapper(F('duration_seconds') / 3600.0, output_field=FloatField())
        ).values(
            'id', 'username', 'date', 'login_time', 'logout_time', 'status', 'duration_hours'
        )

        return Response({'data': list(users_with_attendance)}, status=200)

        

