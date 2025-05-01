from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.models import Employee, Company, EmployeeDashboardLink, LeaveRequest, Event, Holiday, Role
from core.permissions import IsCompanyUser, IsHRorAdmin, IsEmployeeUser
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework import status
from datetime import date
from core.views.utils.dashboard_link import dashboard_links


# User Modek
User = get_user_model()



# Views For Dashboard based on their role and also for organization
class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        is_company = User.objects.filter(username=user).values('is_company').first()
        email = request.user.email
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
            role_id = Employee.objects.filter(company_email=email).values('role_id').first()
            print('role_id ===<<<>>>>>>', role_id)
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
            elif role_id['role_id'] == 2:
                try:
                    role = Role.objects.get(id=role_id['role_id'])
                    user_id = Employee.objects.get(company_email=email).company_id
                    company = Company.objects.get(user_id=user_id).company_name
                    company_id = Company.objects.get(user_id=user_id).id
                    total_employees = Employee.objects.filter(company_id=company_id).count()
                    total_leave_requests = LeaveRequest.objects.filter(employee__company_id=company_id).count()
                    upcoming_events = Event.objects.filter(
                        company_id=company_id, 
                        date__gte=date.today()
                    ).values('title', 'date')

                    employee_details = Employee.objects.filter(active=True ).select_related('role').values('id',
                            'first_name', 'middle_name', 'last_name', 'contact_number', 'company_email',
                            'personal_email', 'date_of_birth', 'gender', 'role__role_name'
                        )


                    return Response({
                        "employee_details": employee_details,
                        "role_id": role_id['role_id'],
                        "role": role.role_name,
                        "email": email,
                        "company": company,
                        "total_employees": total_employees,
                        "total_leave_requests": total_leave_requests,
                        "upcoming_events": upcoming_events,
                    }, status=status.HTTP_200_OK)

                except Company.DoesNotExist:
                    return Response({"error": "Company not found"}, status=status.HTTP_404_NOT_FOUND)

            

            # Solution Engineer
            else:
                if role_id['role_id'] == 3:
                    try:
                        company_id = Employee.objects.get(company_email=email).company_id
                        company_name = Company.objects.filter(id=company_id).values('company_name').first()
                        role = Role.objects.filter(id=role_id['role_id']).values('role_name').first()
                        employee_details = Employee.objects.filter(company_email=email).values('id','first_name', 'middle_name', 'last_name', 'contact_number', 'company_email', 
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
            

# Employee Dashboard Links
class DashboardLinkViewSet(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        try:
            print('request.user.email ===<<<>>>>>>', request.user.email)
            user_data = User.objects.get(email=request.user.email)
            is_company = False
            role_id = None
            if(user_data.is_company == True):
                is_company = True
            else:
                employee = Employee.objects.get(company_email=request.user.email)
                if employee:
                    role_id = employee.role_id
            
            return dashboard_links(role_id, is_company)
        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
            

       

