from datetime import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.models import Employee, Company, LeaveRequest, Event, Holiday
from core.permissions import IsCompanyUser, IsHRorAdmin, IsEmployeeUser
from rest_framework import status




class DashboardCompanyView(APIView):
    permission_classes = [IsAuthenticated, IsCompanyUser]

    def get(self, request, *args, **kwargs):
        try:
            company = Company.objects.get(user=request.user)

            total_employees = Employee.objects.filter(company=company).count()
            total_leave_requests = LeaveRequest.objects.filter(employee__company=company).count()
            upcoming_events = Event.objects.filter(company=company).values('title', 'date')

            return Response({
                "total_employees": total_employees,
                "total_leave_requests": total_leave_requests,
                "upcoming_events": upcoming_events,
            }, status=status.HTTP_200_OK)

        except Company.DoesNotExist:
            return Response({"error": "Company not found"}, status=status.HTTP_404_NOT_FOUND)





class AdminDashboardView(APIView):
    permission_classes = [IsHRorAdmin]

    def get(self, request):
        # Assuming the HR/Admin is an employee
        employee = Employee.objects.get(company_email=request.user.email)
        company = employee.company

        employees = Employee.objects.filter(company=company).count()
        pending_leaves = LeaveRequest.objects.filter(employee__company=company, status='Pending').count()

        return Response({
            "admin": f"{employee.first_name} {employee.last_name}",
            "company": company.company_name,
            "total_employees": employees,
            "pending_leave_requests": LeaveRequest.objects.filter(
                employee__company=company, status='Pending'
            ).values('employee__first_name', 'from_date', 'to_date', 'reason'),
        })


class EmployeeDashboardView(APIView):
    permission_classes = [IsEmployeeUser]

    def get(self, request):
        employee = Employee.objects.get(company_email=request.user.email)

        leaves = LeaveRequest.objects.filter(employee=employee).count()
        events = Event.objects.filter(company=employee.company).count()
        holidays = Holiday.objects.filter(company=employee.company).count()

        return Response({
            "employee": f"{employee.first_name} {employee.last_name}",
            "role": employee.role.title if employee.role else "Not Assigned",
            "leave_requests": LeaveRequest.objects.filter(employee=employee).values('from_date', 'to_date', 'status'),
            "upcoming_events": Event.objects.filter(company=employee.company).values('title', 'date'),
            "available_holidays": Holiday.objects.filter(company=employee.company).values('name', 'date'),
        })
