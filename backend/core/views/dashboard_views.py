from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.models import Employee, Company, LeaveRequest, Event, Holiday, Role
from core.permissions import IsCompanyUser, IsHRorAdmin, IsEmployeeUser
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework import status
from datetime import date


# User Modek
User = get_user_model()



# Views For Dashboard based on their role and also for organization
class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        is_company = User.objects.filter(username=user).values('is_company').first()
        email = request.user.email
        print('email ==<<>>', email)
        if(is_company['is_company']):
            try:
                if hasattr(user, 'is_company') and user.is_company:
                    company = Company.objects.get(company_name=user)
                    company_id = company.id
                    total_employees = Employee.objects.filter(company_id=company_id).count()
                    total_leave_requests = LeaveRequest.objects.filter(employee__company_id=company_id).count()
                    upcoming_events = Event.objects.filter(company_id=company_id, date__gte=date.today()).values('title', 'date')

                    return Response({
                        "is_company": is_company['is_company'],
                        'email': email,
                        "role": "Company",
                        "company": company.company_name,
                        "total_employees": total_employees,
                        "total_leave_requests": total_leave_requests,
                        "upcoming_events": upcoming_events,
                    }, status=status.HTTP_200_OK)
                
            except Company.DoesNotExist:
                    return Response({"error": "Company not found"}, status=status.HTTP_404_NOT_FOUND)
        
        else:
            role_id = Employee.objects.filter(first_name=user).values('role_id').first()
            # Admin Dashboard
            if(role_id['role_id'] == 1):
                try:
                    company = Company.objects.get(company_name=user)
                    company_id = company.id
                    total_employees = Employee.objects.filter(company_id=company_id).count()
                    total_leave_requests = LeaveRequest.objects.filter(employee__company_id=company_id).count()
                    upcoming_events = Event.objects.filter(company_id=company_id, date__gte=date.today()).values('title', 'date')

                    return Response({
                        "role_id": role_id['role_id'],
                        'email': email,
                        "role": "Company",
                        "company": company.company_name,
                        "total_employees": total_employees,
                        "total_leave_requests": total_leave_requests,
                        "upcoming_events": upcoming_events,
                    }, status=status.HTTP_200_OK)
                
                except Company.DoesNotExist:
                        return Response({"error": "Company not found"}, status=status.HTTP_404_NOT_FOUND)
        
            
            # Hr Dashboard
            elif(role_id['role_id'] == 2):
                try:
                    company = Company.objects.get(company_name=user)
                    company_id = company.id
                    total_employees = Employee.objects.filter(company_id=company_id).count()
                    total_leave_requests = LeaveRequest.objects.filter(employee__company_id=company_id).count()
                    upcoming_events = Event.objects.filter(company_id=company_id, date__gte=date.today()).values('title', 'date')

                    return Response({
                        "role_id": role_id['role_id'],
                        "role": "Company",
                        'email': email,
                        "company": company.company_name,
                        "total_employees": total_employees,
                        "total_leave_requests": total_leave_requests,
                        "upcoming_events": upcoming_events,
                    }, status=status.HTTP_200_OK)
                
                except Company.DoesNotExist:
                        return Response({"error": "Company not found"}, status=status.HTTP_404_NOT_FOUND)
            

            # Solution Engineer
            else:
                try:
                    company_id = Employee.objects.get(first_name=user).company_id
                    company_name = Company.objects.filter(id=company_id).values('company_name').first()
                    role = Role.objects.filter(id=role_id['role_id']).values('role_name').first()
                    employee_details = Employee.objects.filter(first_name=user).values('first_name', 'middle_name', 'last_name', 'contact_number', 'company_email', 
                            'personal_email', 'date_of_birth', 'gender')

                    return Response({
                        "employee_details": employee_details,
                        'email': email,
                        "role": role['role_name'],
                        "role_id": role_id['role_id'],
                        "company": company_name['company_name'],
                    }, status=status.HTTP_200_OK)
                
                except Company.DoesNotExist:
                        return Response({"error": "Company not found"}, status=status.HTTP_404_NOT_FOUND)
            


            

       

