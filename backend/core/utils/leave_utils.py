from django.db.models import F, Value, CharField
from django.db.models.functions import Concat
from core.models import LeaveRequest 
from rest_framework import viewsets, status
from rest_framework.response import Response
from core.utils.utils import is_profile_complete

def get_leave_requests(is_company, role_id, emp_id):
    # Base query with annotated username
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

    # Filter based on role
    if is_company:
        leave_requests = base_query.filter(hr_reviewed=True)
    elif role_id == 2:  # HR
        leave_requests = base_query
    elif role_id == 3:  # Employee
        result = is_profile_complete(emp_id)
        if not result['is_complete']:
                return {
                    "success": False,
                    "is_complete": False,
                    "message": result['message'],
                    "missing_sections": result['missing_sections'],
                    "data": None
                }
        leave_requests = base_query.filter(employee_id=emp_id)
    else:
        leave_requests = LeaveRequest.objects.none() 

    return  {
            "success": True,
            "is_complete": True,
            "message": "Leave requests fetched successfully.",
            "data": list(leave_requests),
            "missing_sections": None
        }

