def apply_common_filters(queryset, request):
    status_param = request.query_params.get("status")
    start_date_param = request.query_params.get("start_date")
    end_date_param = request.query_params.get("end_date")
    project_id = request.query_params.get("project_id")
    priority = request.query_params.get("priority")

    if status_param:
        queryset = queryset.filter(status=status_param)

    if start_date_param:
        queryset = queryset.filter(start_date__gte=start_date_param)

    if end_date_param:
        queryset = queryset.filter(end_date__lte=end_date_param)

    if project_id:
        queryset = queryset.filter(id=project_id)

    if priority:
        queryset = queryset.filter(priority=priority)

    return queryset
