from rest_framework.generics import ListAPIView
from core.models import Attendance, Employee
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

        attendance_qs = Attendance.objects.filter(
            user=OuterRef('pk'),
            date=today
        )

        users_with_attendance = User.objects.annotate(
            
            login_time=Subquery(attendance_qs.values('login_time')[:1]),
            logout_time=Subquery(attendance_qs.values('logout_time')[:1]),
            date=Subquery(attendance_qs.values('date')[:1]),
            status=Coalesce(
                Subquery(attendance_qs.values('status')[:1]),
                Value('Absent')
            ),
            duration_hours=ExpressionWrapper(
                (
                    ExtractHour(F('logout_time') - F('login_time')) * 3600 +
                    ExtractMinute(F('logout_time') - F('login_time')) * 60 +
                    ExtractSecond(F('logout_time') - F('login_time'))
                ) / 3600.0,
                output_field=FloatField()
            )
        ).values(
            'id',
            'username',
            'date',
            'login_time',
            'logout_time',
            'status',
            'duration_hours'
        )

        return Response({'data': list(users_with_attendance)}, status=200)


