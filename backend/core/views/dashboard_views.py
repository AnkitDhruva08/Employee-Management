from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.models import Employee, Company, EmployeeDashboardLink, LeaveRequest, Event, Holiday, Role
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework import status
from datetime import date
from core.utils.dashboard_link import dashboard_links
from django.db.models import Count, Q


# User Modek
User = get_user_model()

# Views For Dashboard based on their role and also for organization
class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        is_company = User.objects.filter(username=user).values('is_company').first()
        is_superuser = User.objects.filter(username=user).values('is_superuser').first()
        email = request.user.email
        if is_superuser['is_superuser']:
            try:
                if hasattr(user, 'is_superuser') and user.is_superuser:
                    superUser = User.objects.get(username=user)

                    # Get all companies with employee counts (active only)
                    companies_with_teams = User.objects.filter(
                        employees__active=True
                    ).annotate(
                        team_size=Count('employees', filter=Q(employees__active=True))
                    ).distinct()

                    # Prepare the response data
                    companies_data = []
                    for company in companies_with_teams:
                        companies_data.append({
                            "company_id": company.id,
                            "company_name": company.get_full_name() or company.username,
                            "email": company.email,
                            "team_size": company.team_size
                        })

                    return Response({
                        "is_superuser": is_superuser['is_superuser'],
                        "email": email,
                        "role": "is_superuser",
                        "companies": companies_data
                    }, status=status.HTTP_200_OK)

            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
            # Admin Dashboard
            if(role_id['role_id'] == 1):
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
                            'personal_email', 'date_of_birth', 'gender',  'profile_image','role__role_name'
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
                            'personal_email', 'date_of_birth', 'gender',  'profile_image','role__role_name'
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
                                'personal_email', 'date_of_birth', 'gender', 'profile_image')
                        

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
            user_data = User.objects.get(email=request.user.email)
            email = request.user.email
            is_company = False
            role_id = None
            is_superuser = False
            if(user_data.is_company == True):
                is_company = True
            if(user_data.is_superuser == True):
                is_superuser = True
            elif not user_data.is_company:
                try:
                    employee = Employee.objects.get(company_email=email)
                    role_id = employee.role_id
                except Employee.DoesNotExist:
                    return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
            
            return dashboard_links(role_id, is_company, email, is_superuser)
        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
            

       

