from django.db.models import F, Value, CharField
from django.db.models.functions import Concat
from core.models import LeaveRequest 

def get_leave_requests(is_company, role_id, emp_id):
    print('role_id ankit mishra :', role_id)

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
        print('ankit Mishra :::::::')
        leave_requests = base_query.filter(employee_id=emp_id)
    else:
        leave_requests = LeaveRequest.objects.none() 

    return leave_requests
