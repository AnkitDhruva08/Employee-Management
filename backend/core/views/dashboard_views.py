from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.models import Employee, Company, EmployeeDashboardLink, LeaveRequest, Event, Holiday, ProjectSideBar, Role, TaskSideBar, Project, Task
from core.serializers import ProjectSidebarSerializer, TaskSidebarSerializer
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
        email = user.email

        if user.is_superuser:
            return self._superuser_dashboard(user.email)

        if user.is_company:
            return self._company_dashboard(user, email)

        return self._employee_dashboard(user, email)

    def _superuser_dashboard(self, super_user_email):
        try:
            companies_with_teams = User.objects.filter(is_company=True).annotate(
                team_size=Count('company__employees', filter=Q(company__employees__active=True))
            )

            companies_data = []
            for company in companies_with_teams:
                try:
                    company_obj = getattr(company, 'company', None)
                    if not company_obj:
                        print(f" No related Company object found for user: {company.email}")
                        continue

                    profile_image = getattr(company_obj, 'profile_image', None)
                    contact_number = getattr(company_obj, 'contact_number', None)

                    # Collect address fields
                    address_data = {
                        "street_address": company_obj.street_address,
                        "city": company_obj.city,
                        "state_province": company_obj.state_province,
                        "zip_code": company_obj.zip_code,
                        "country": company_obj.country,
                    }

                    company_size = company_obj.team_size

                    companies_data.append({
                        "company_id": company.id,
                        "company_name": company.get_full_name() or company.username,
                        "company_email": company.email,
                        "team_size": company.team_size,
                        "company_size": company_size,
                        "contact_number": contact_number,
                        "company_logo": profile_image.url if profile_image else None,
                        "address": address_data,
                    })

                except Exception as inner_e:
                    print(f" Error processing company {company.email}: {inner_e}")

            return Response({
                "is_superuser": True,
                "email": super_user_email,
                "role": "is_superuser",
                "companies": companies_data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




    def _company_dashboard(self, user, email):
        try:
            company = Company.objects.get(company_name=user)
            company_id = company.id
            total_employees = Employee.objects.filter(company_id=company_id).count()
            total_leave_requests = LeaveRequest.objects.filter(employee__company_id=company_id).count()
            upcoming_events = Event.objects.filter(company_id=company_id, date__gte=date.today()).values('title', 'date')

            return Response({
                "is_company": True,
                "email": email,
                "role": "Company",
                "company": company.company_name,
                "total_employees": total_employees,
                "total_leave_requests": total_leave_requests,
                "upcoming_events": upcoming_events,
                "company_logo": str(company.profile_image) if company.profile_image else None
            }, status=status.HTTP_200_OK)

        except Company.DoesNotExist:
            return Response({"error": "Company not found"}, status=status.HTTP_404_NOT_FOUND)
        
   

    def _employee_dashboard(self, user, email):
        role_info = Employee.objects.filter(company_email=email).values('role_id', 'company_id').first()
        if not role_info:
            return Response({"error": "Employee not found"}, status=status.HTTP_404_NOT_FOUND)

        role_id = role_info['role_id']
        company_id = role_info['company_id']
        role = Role.objects.filter(id=role_id).first()
        employee_data = Employee.objects.filter(company_email=email).first()
        profile_image = str(employee_data.profile_image) if employee_data.profile_image else None
        company_name = Company.objects.filter(id=company_id).values('company_name').first()
        company = Company.objects.get(id=company_id)

        common_data = {
            "role_id": role_id,
            "role": role.role_name if role else "Unknown",
            "email": email,
            "company": company_name['company_name'] if company_name else "N/A",
        }

        if role_id in [1, 2]:  # Admin or HR
            total_employees = Employee.objects.filter(company_id=company_id).count()
            total_leave_requests = LeaveRequest.objects.filter(employee__company_id=company_id).count()
            upcoming_events = Event.objects.filter(company_id=company_id, date__gte=date.today()).values('title', 'date')
            total_projects = Project.objects.filter(company_id=company_id).count()
            total_tasks = Task.objects.filter(company_id=company_id).count()
            
            data_details = Employee.objects.get(company_email=email, active=True)
            hr_name = ''
            admin_name = ''

            if(role_id == 1):
                admin_name = f"{data_details.first_name} {data_details.last_name}"

            elif(role_id == 2):
                hr_name = f"{data_details.first_name} {data_details.last_name}"
        

            employee_details = Employee.objects.filter(active=True).select_related('role').values(
                'id', 'first_name', 'middle_name', 'last_name', 'contact_number',
                'company_email', 'personal_email', 'date_of_birth', 'gender',
                'profile_image', 'role__role_name'
            )

            return Response({
                **common_data,
                "company_logo": str(company.profile_image) if company.profile_image else None,
                "employee_details": employee_details,
                "hr_name" : hr_name,
                "admin_name" : admin_name,
                "total_employees": total_employees,
                "total_leave_requests": total_leave_requests,
                "upcoming_events": upcoming_events,
                "admin_profile" if role_id == 1 else "hr_profile": profile_image,
                "total_projects" : total_projects,
                "total_tasks": total_tasks,
                **({ "departments": 5} if role_id == 1 else {})
            }, status=status.HTTP_200_OK)

        # Solution Engineer or others
        employee_details = Employee.objects.filter(company_email=email).values(
            'id', 'first_name', 'middle_name', 'last_name', 'contact_number',
            'company_email', 'personal_email', 'date_of_birth', 'gender', 'profile_image'
        )
        return Response({
            **common_data,
            "company_logo": str(company.profile_image) if company.profile_image else None,
            "employee_details": employee_details
        }, status=status.HTTP_200_OK)

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
        



class ProjectSideBarView(APIView):
    def get(self, request):
        projects = ProjectSideBar.objects.filter(active=True).order_by('id')
        serializer = ProjectSidebarSerializer(projects, many=True)
        return Response({"project_links": serializer.data}) 

class TaskSideBarView(APIView):
    def get(self, request):
        tasks = TaskSideBar.objects.filter(active=True).order_by('id')
        serializer = TaskSidebarSerializer(tasks, many=True)
        return Response({"task_lins": serializer.data}) 

       

