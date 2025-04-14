from rest_framework.permissions import BasePermission
from core.models import Employee, Company




class IsCompanyUser(BasePermission):
    def has_permission(self, request, view):
        try:
            # Allow only users associated with a Company
            return Company.objects.filter(user=request.user).exists()
        except:
            return False




class IsEmployeeUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_employee


class IsHRorAdmin(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated or not request.user.is_employee:
            return False
        try:
            employee = Employee.objects.get(company_email=request.user.email)
            return employee.role.title.lower() in ['hr', 'admin']
        except Employee.DoesNotExist:
            return False
