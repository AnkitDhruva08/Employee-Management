from django.db.models.functions import ExtractMonth, ExtractYear
from django.db import models

def apply_common_filters(queryset, request):
    status_param = request.query_params.get("status")
    start_date_param = request.query_params.get("start_date")
    end_date_param = request.query_params.get("end_date")
    project_id = request.query_params.get("project_id")
    priority = request.query_params.get("priority")
    employee_id = request.query_params.get("employee")
    attendance_emp_id = request.query_params.get("employee_id")
    status_id = request.query_params.get("tag")
    month_param = request.query_params.get("month")
    specific_date = request.query_params.get("specific_date")

    # Attendance-specific filters
    date_param = request.query_params.get("date")
    year_param = request.query_params.get("year")

    if status_param:
        queryset = queryset.filter(status=status_param)

    if start_date_param:
        queryset = queryset.filter(created_at__date__gte=start_date_param)

    if end_date_param:
        queryset = queryset.filter(created_at__date__lte=end_date_param)

    if project_id:
        queryset = queryset.filter(project_id=project_id)

    if priority:
        queryset = queryset.filter(priority=priority)

    if employee_id:
        queryset = queryset.filter(
            models.Q(members__id=employee_id) | models.Q(team_lead__id=employee_id)
        )
    if attendance_emp_id:
        queryset = queryset.filter(employee_id=attendance_emp_id)

    if status_id:
        queryset = queryset.filter(status_id=status_id)

    if specific_date:
        print(' am inside specific data')
        queryset = queryset.filter(date=specific_date)

    # Specific day filter
    if date_param:
        queryset = queryset.filter(created_at__date=date_param)

    # Month filter
    if month_param:
        try:
            month_int = int(month_param)
            if 1 <= month_int <= 12:
                queryset = queryset.annotate(month=ExtractMonth('created_at')).filter(month=month_int)
        except ValueError:
            pass

    # Year filter
    if year_param:
        try:
            year_int = int(year_param)
            queryset = queryset.annotate(year=ExtractYear('created_at')).filter(year=year_int)
        except ValueError:
            pass

    return queryset
