from django.db.models.functions import ExtractMonth

def apply_common_filters(queryset, request):
    status_param = request.query_params.get("status")
    start_date_param = request.query_params.get("start_date")
    end_date_param = request.query_params.get("end_date")
    project_id = request.query_params.get("project_id")
    priority = request.query_params.get("priority")
    employee_id = request.query_params.get("employee")
    status_id = request.query_params.get("tag")
    month_param = request.query_params.get("month")

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
        queryset = queryset.filter(members__id=employee_id)

    if status_id:
        queryset = queryset.filter(status_id=status_id)

    if month_param:
        try:
            month_int = int(month_param)
            if 1 <= month_int <= 12:
                queryset = queryset.annotate(month=ExtractMonth('created_at')).filter(month=month_int)
        except ValueError:
            pass  # Ignore invalid month values

    return queryset

