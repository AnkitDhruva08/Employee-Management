from rest_framework.response import Response
from rest_framework import status
from core.models import CompanyDashboardLink, HrDashboardLink, AdminDashboardLink, EmployeeDashboardLink, ProjectSideBar, TaskSideBar, Company, Employee, Event, LeaveRequest

from core.serializers import (
    CompanyDashboardLinkSerializer, HrDashboardLinkSerializer, AdminDashboardLinkSerializer,
    EmployeeDashboardLinkSerializer, ProjectSidebarSerializer, TaskSidebarSerializer
)
from core.utils.utils import is_profile_complete
from datetime import date
import traceback


from core.models import Project, Task


def get_common_dashboard_data(company_id):
    print('company_id ==<<>>>',  company_id)
    total_employees = Employee.objects.filter(company_id=company_id).count()
    print('total_employees =<<>>>', total_employees)
    total_leave_requests = LeaveRequest.objects.filter(employee__company_id=company_id).count()
    upcoming_events = Event.objects.filter(company_id=company_id, date__gte=date.today()).values('title', 'date')
    total_projects = Project.objects.filter(company_id=company_id, active=True).count()
    print('total_projects =<<<>>', total_projects)
    total_tasks = Task.objects.filter(company_id=company_id, active=True).count()

    return {
        "total_employees": total_employees,
        "total_leave_requests": total_leave_requests,
        "upcoming_events": list(upcoming_events),
        "total_projects": total_projects,
        "total_tasks": total_tasks,
    }


def dashboard_links(role_id, is_company, email, is_superuser):
    print('role_id:', role_id, 'is_company:', is_company, 'email:', email, 'is_superuser:', is_superuser)
    try:
        data = {}

        # Project & Task Sidebar
        project_links = ProjectSideBar.objects.filter(active=True).order_by("id")
        project_serialized = ProjectSidebarSerializer(project_links, many=True).data

        task_links = TaskSideBar.objects.filter(active=True).order_by("id")
        task_serialized = TaskSidebarSerializer(task_links, many=True).data

        # Superuser Dashboard
        if is_superuser:
            dashboard_links = CompanyDashboardLink.objects.filter(active=True).order_by("id")
            serializer = CompanyDashboardLinkSerializer(dashboard_links, many=True)

            companies = Company.objects.all()
            company_data = [
                {
                    "company_id": company.id,
                    "company_name": company.company_name,
                    "team_size": Employee.objects.filter(company=company).count(),
                    "email": company.email
                }
                for company in companies
            ]

            combined_sidebar = serializer.data + [
                {
                    "name": "Projects",
                    "icons": "FaProjectDiagram",
                    "submenu": project_serialized
                },
                {
                    "name": "Tasks",
                    "icons": "FaTasks",
                    "submenu": task_serialized
                }
            ]

            data.update({
                "dashboard_links": serializer.data,
                "sidebar": combined_sidebar,
                "total_employees": Employee.objects.count(),
                "total_leave_requests": LeaveRequest.objects.count(),
                "upcoming_events": list(Event.objects.filter(date__gte=date.today()).values('title', 'date')),
                "companies": company_data,
                "is_superuser": True
            })
            return Response(data, status=status.HTTP_200_OK)

        # Company / Admin Dashboard
        elif is_company or role_id == 1:
            if is_company:
                company_obj = Company.objects.get(email=email)
            else:
                employee = Employee.objects.get(company_email=email)
                company_obj = employee.company

            company_id = company_obj.id
            common_data = get_common_dashboard_data(company_id)

            if role_id == 1:
                dashboard_links = AdminDashboardLink.objects.filter(active=True).order_by("id")
                serializer = AdminDashboardLinkSerializer(dashboard_links, many=True)
            else:
                dashboard_links = CompanyDashboardLink.objects.filter(active=True).order_by("id")
                serializer = CompanyDashboardLinkSerializer(dashboard_links, many=True)

            combined_sidebar = serializer.data + [
                {
                    "name": "Projects",
                    "icons": "FaProjectDiagram",
                    "submenu": project_serialized
                },
                {
                    "name": "Tasks",
                    "icons": "FaTasks",
                    "submenu": task_serialized
                }
            ]

            data.update({
                "dashboard_links": serializer.data,
                "sidebar": combined_sidebar,
                "total_employees": common_data["total_employees"],
                "total_leave_requests": common_data["total_leave_requests"],
                "upcoming_events": common_data["upcoming_events"],
                "total_projects": common_data["total_projects"],
                "total_tasks": common_data["total_tasks"],
            })
            print('data ==<<>>', data)
            return Response(data, status=status.HTTP_200_OK)

        # HR Dashboard
        elif role_id == 2:
            employee = Employee.objects.get(company_email=email)
            company_id = employee.company_id
            common_data = get_common_dashboard_data(company_id)

            dashboard_links = HrDashboardLink.objects.filter(active=True).order_by("id")
            serializer = HrDashboardLinkSerializer(dashboard_links, many=True)

            combined_sidebar = serializer.data + [
                {
                    "name": "Projects",
                    "icons": "FaProjectDiagram",
                    "submenu": project_serialized
                },
                {
                    "name": "Tasks",
                    "icons": "FaTasks",
                    "submenu": task_serialized
                }
            ]

            data.update({
                "dashboard_links": serializer.data,
                "sidebar": combined_sidebar,
                "total_employees": common_data["total_employees"],
                "total_leave_requests": common_data["total_leave_requests"],
                "upcoming_events": common_data["upcoming_events"],
                "total_projects": common_data["total_projects"],
                "total_tasks": common_data["total_tasks"],
            })
            return Response(data, status=status.HTTP_200_OK)

        # Employee Dashboard
        elif role_id == 3:
            try:
                employee = Employee.objects.get(company_email=email)
                employee_id = employee.id
                result = is_profile_complete(employee_id)

                dashboard_links = EmployeeDashboardLink.objects.filter(active=True).order_by("id")

                if not isinstance(result, dict) or 'is_complete' not in result:
                    return Response({'error': 'Unexpected response from is_profile_complete'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                is_complete = result.get('is_complete', True)
                message = result.get('message', "")
                missing_sections = result.get('missing_sections', [])

                if not is_complete:
                    restricted_titles = ["Leave", "Holiday Calendar", "Payslips", "Attendance Overview", "Projects", "Tasks"]
                    dashboard_links = dashboard_links.exclude(name__in=restricted_titles)

                serializer = EmployeeDashboardLinkSerializer(dashboard_links, many=True)

                project_sidebar = []
                task_sidebar = []
                if is_complete:
                    project_sidebar = ProjectSideBar.objects.filter(active=True).order_by("id")
                    task_sidebar = TaskSideBar.objects.filter(active=True).order_by("id")

                project_serialized = ProjectSidebarSerializer(project_sidebar, many=True).data
                task_serialized = TaskSidebarSerializer(task_sidebar, many=True).data

                combined_sidebar = serializer.data
                if is_complete:
                    combined_sidebar += [
                        {
                            "name": "Projects",
                            "icons": "FaProjectDiagram",
                            "submenu": project_serialized
                        },
                        {
                            "name": "Tasks",
                            "icons": "FaTasks",
                            "submenu": task_serialized
                        }
                    ]

                return Response({
                    "success": True,
                    "is_complete": is_complete,
                    "message": message,
                    "missing_sections": missing_sections,
                    "dashboard_links": serializer.data,
                    "sidebar": combined_sidebar
                }, status=status.HTTP_200_OK)

            except Employee.DoesNotExist:
                return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

        # Invalid role fallback
        return Response({"error": "Invalid role_id or access"}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        print("Exception in dashboard_links:", traceback.format_exc())
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
