from django.db.models import F, Value, CharField
from django.db.models.functions import Concat
from core.models import LeaveRequest , Employee
from rest_framework import viewsets, status
from rest_framework.response import Response
from core.utils.utils import is_profile_complete


def get_leave_requests(is_company, role_id, emp_id, company_id):

    # Common annotation for username
    def get_annotated_query():
        return LeaveRequest.objects.select_related('employee').annotate(
            username=Concat(
                F('employee__first_name'),
                Value(' '),
                F('employee__last_name'),
                output_field=CharField()
            )
        )

    # --- Non-company users (HR or Employees) ---
    if not is_company:
        try:
            hr_data = Employee.objects.get(id=emp_id)
        except Employee.DoesNotExist:
            return {
                "success": False,
                "message": "Employee not found.",
                "data": None
            }

        base_query = get_annotated_query().values(
            'username',
            'id',
            'to_date',
            'from_date',
            'reason',
            'status',
            'applied_at',
            'leave_type',
            'leave_document',
            'employee_id',
            'employee__company_id',
            'employee__role_id'
        ).order_by('-id')


        if role_id == 1:  # admin
            leave_requests = base_query.filter(employee__company_id=company_id)
            print('leave_requests ==<<<>>', leave_requests)

        elif role_id == 2:  # HR
            leave_requests = base_query.filter(employee__company_id=company_id)

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
            leave_requests = base_query.filter(
                employee_id=emp_id,
                employee__company_id=company_id
            )
        else:
            leave_requests = LeaveRequest.objects.none()

    # --- Company admin view ---
    else:
        base_query = get_annotated_query().values(
            'username',
            'id',
            'to_date',
            'from_date',
            'reason',
            'status',
            'applied_at',
            'leave_type',
            'leave_document',
            'employee_id',
            'employee__company_id'
        ).order_by('-id')

        leave_requests = base_query.filter(
            employee__company_id=company_id,
            # hr_reviewed=True
        )


    return {
        "success": True,
        "is_complete": True,
        "message": "Leave requests fetched successfully.",
        "data": list(leave_requests),
        "missing_sections": None
    }
