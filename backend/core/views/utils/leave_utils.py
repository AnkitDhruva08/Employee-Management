from core.models import LeaveRequest
from django.contrib.auth import get_user_model
from django.db.models import F, Value, CharField
from django.db.models.functions import Concat

# Getting LeaveRequest Data 
def get_leave_requests(is_company, is_hr):
    # Define the common query part for leave requests
    base_query = LeaveRequest.objects.select_related('employee').annotate(
        username=Concat(
            F('employee__first_name'),
            Value(' '),
            F('employee__last_name'),
            output_field=CharField()
        )
    ).values(
        'username',
        'id',
        'to_date',
        'from_date',
        'reason',
        'status',
        'applied_at',
        'leave_type'
    ).order_by('-id')

    # Apply additional filters based on role
    if is_company:
        # Fetch only the HR-reviewed leave requests for the company
        leave_requests = base_query.filter(hr_reviewed=True)
    elif is_hr:
        # Fetch all leave requests for HR
        leave_requests = base_query
    
    return leave_requests
