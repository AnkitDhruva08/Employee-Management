from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from core.utils.utils import is_profile_complete
from core.models import  Company, Employee, EmployeeDashboardLink, Event, HrDashboardLink, CompanyDashboardLink, LeaveRequest, User,Holiday, ProjectSideBar, Role, TaskSideBar
from core.serializers import EmployeeDashboardLinkSerializer, HrDashboardLinkSerializer, CompanyDashboardLinkSerializer, ProjectSidebarSerializer, TaskSidebarSerializer
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import F, Value, CharField
from django.db.models.functions import Concat
import traceback
from django.shortcuts import get_object_or_404
from datetime import date


def get_common_dashboard_data(company_id):
    total_employees = Employee.objects.filter(company_id=company_id).count()
    total_leave_requests = LeaveRequest.objects.filter(employee__company_id=company_id).count()
    upcoming_events = Event.objects.filter(company_id=company_id, date__gte=date.today()).values('title', 'date')
    return total_employees, total_leave_requests, list(upcoming_events)

# def dashboard_links(role_id, is_company, email, is_superuser):
#     print('role_id:', role_id, 'is_company:', is_company, 'email:', email, 'is_superuser:', is_superuser)
#     try:

#         data = {}

#         # Superuser Dashboard
#         if is_superuser:
#             dashboard_links = CompanyDashboardLink.objects.filter(active=True).order_by("id")
#             serializer = CompanyDashboardLinkSerializer(dashboard_links, many=True)

#             companies = User.objects.filter(is_company=True)
#             company_data = [
#                 {
#                     "company_id": company.id,
#                     "company_name": company.get_full_name() or company.username or company.email,
#                     "team_size": Employee.objects.filter(company=company).count(),
#                     "email": company.email
#                 }
#                 for company in companies
#             ]

#             data.update({
#                 "dashboard_links": serializer.data,
#                 "total_employees": Employee.objects.count(),
#                 "total_leave_requests": LeaveRequest.objects.count(),
#                 "upcoming_events": list(Event.objects.filter(date__gte=date.today()).values('title', 'date')),
#                 "companies": company_data,
#                 "is_superuser": True
#             })
#             return Response(data, status=status.HTTP_200_OK)

#         # Company or Admin Dashboard (role_id == 1)
#         elif is_company or role_id == 1:
#             dashboard_links = CompanyDashboardLink.objects.filter(active=True).order_by("id")
#             serializer = CompanyDashboardLinkSerializer(dashboard_links, many=True)

#             if is_company:
#                 company_obj = Company.objects.get(email=email)
#             else:
#                 employee = Employee.objects.get(company_email=email)
#                 company_obj = employee.company

#             company_id = company_obj.id
#             total_employees, total_leave_requests, upcoming_events = get_common_dashboard_data(company_id)

#             data.update({
#                 "dashboard_links": serializer.data,
#                 "total_employees": total_employees,
#                 "total_leave_requests": total_leave_requests,
#                 "upcoming_events": upcoming_events
#             })
#             return Response(data, status=status.HTTP_200_OK)

#         # HR Dashboard (role_id == 2)
#         elif role_id == 2:
#             dashboard_links = HrDashboardLink.objects.filter(active=True).order_by("id")
#             serializer = HrDashboardLinkSerializer(dashboard_links, many=True)

#             employee = Employee.objects.get(company_email=email)
#             company_id = employee.company_id
#             total_employees, total_leave_requests, upcoming_events = get_common_dashboard_data(company_id)

#             data.update({
#                 "dashboard_links": serializer.data,
#                 "total_employees": total_employees,
#                 "total_leave_requests": total_leave_requests,
#                 "upcoming_events": upcoming_events
#             })
#             return Response(data, status=status.HTTP_200_OK)

#         # Employee Dashboard (role_id == 3)
#         elif role_id == 3:
#             try:
#                 employee = Employee.objects.get(company_email=email)
#                 employee_id = employee.id
#                 result = is_profile_complete(employee_id)

#                 if not isinstance(result, dict) or 'is_complete' not in result:
#                     return Response({'error': 'Unexpected response from is_profile_complete function'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#                 dashboard_links = EmployeeDashboardLink.objects.filter(active=True).order_by("id")

#                 if not result['is_complete']:
#                     restricted_titles = ["Leave", "Holiday Calendar", "Payslips", "Attendance Overview", "Projects", "Tasks"]
#                     dashboard_links = dashboard_links.exclude(name__in=restricted_titles)

#                     serializer = EmployeeDashboardLinkSerializer(dashboard_links, many=True)
#                     return Response({
#                         "is_complete": False,
#                         "message": result['message'],
#                         "missing_sections": result['missing_sections'],
#                         "dashboard_links": serializer.data
#                     }, status=status.HTTP_200_OK)

#                 serializer = EmployeeDashboardLinkSerializer(dashboard_links, many=True)
#                 return Response({
#                     "success": True,
#                     "dashboard_links": serializer.data
#                 }, status=status.HTTP_200_OK)

#             except Employee.DoesNotExist:
#                 return Response({'error': 'Employee not found with the provided email'}, status=status.HTTP_404_NOT_FOUND)
#             except Exception as e:
#                 import traceback
#                 print("Exception in role_id 3 block:", traceback.format_exc())
#                 return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#         # Fallback
#         else:
#             return Response({"error": "Invalid role_id or access"}, status=status.HTTP_400_BAD_REQUEST)

#     except Exception as e:
#         return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



def dashboard_links(role_id, is_company, email, is_superuser):
    print('role_id:', role_id, 'is_company:', is_company, 'email:', email, 'is_superuser:', is_superuser)
    try:
        data = {}

        # Fetch project and task sidebar links
        project_links = ProjectSideBar.objects.filter(active=True).order_by("id")
        project_serialized = ProjectSidebarSerializer(project_links, many=True).data

        task_links = TaskSideBar.objects.filter(active=True).order_by("id")
        task_serialized = TaskSidebarSerializer(task_links, many=True).data

        # Superuser Dashboard
        if is_superuser:
            dashboard_links = CompanyDashboardLink.objects.filter(active=True).order_by("id")
            serializer = CompanyDashboardLinkSerializer(dashboard_links, many=True)

            companies = User.objects.filter(is_company=True)
            company_data = [
                {
                    "company_id": company.id,
                    "company_name": company.get_full_name() or company.username or company.email,
                    "team_size": Employee.objects.filter(company=company).count(),
                    "email": company.email
                }
                for company in companies
            ]

            # ⬇️ Add combined sidebar
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

        # Company or Admin Dashboard
        elif is_company or role_id == 1:
            dashboard_links = CompanyDashboardLink.objects.filter(active=True).order_by("id")
            serializer = CompanyDashboardLinkSerializer(dashboard_links, many=True)

            if is_company:
                company_obj = Company.objects.get(email=email)
            else:
                employee = Employee.objects.get(company_email=email)
                company_obj = employee.company

            company_id = company_obj.id
            total_employees, total_leave_requests, upcoming_events = get_common_dashboard_data(company_id)

            # ⬇️ Add combined sidebar
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
                "total_employees": total_employees,
                "total_leave_requests": total_leave_requests,
                "upcoming_events": upcoming_events
            })
            return Response(data, status=status.HTTP_200_OK)

        # HR Dashboard
        elif role_id == 2:
            dashboard_links = HrDashboardLink.objects.filter(active=True).order_by("id")
            serializer = HrDashboardLinkSerializer(dashboard_links, many=True)

            employee = Employee.objects.get(company_email=email)
            company_id = employee.company_id
            total_employees, total_leave_requests, upcoming_events = get_common_dashboard_data(company_id)

            # ⬇️ Add combined sidebar
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
                "total_employees": total_employees,
                "total_leave_requests": total_leave_requests,
                "upcoming_events": upcoming_events
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
                    return Response({'error': 'Unexpected response from is_profile_complete function'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                is_complete = result.get('is_complete', True)
                message = result.get('message', "")
                missing_sections = result.get('missing_sections', [])

                # Restrict main links
                if not is_complete:
                    restricted_titles = ["Leave", "Holiday Calendar", "Payslips", "Attendance Overview", "Projects", "Tasks"]
                    dashboard_links = dashboard_links.exclude(name__in=restricted_titles)

                serializer = EmployeeDashboardLinkSerializer(dashboard_links, many=True)

                # Restrict Projects and Tasks submenu if not complete
                project_sidebar = []
                task_sidebar = []
                if is_complete:
                    project_sidebar = ProjectSideBar.objects.filter(active=True).order_by("id")
                    task_sidebar = TaskSideBar.objects.filter(active=True).order_by("id")

                project_serialized = ProjectSidebarSerializer(project_sidebar, many=True).data
                task_serialized = TaskSidebarSerializer(task_sidebar, many=True).data

                # Sidebar combined
                combined_sidebar = serializer.data + []

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
                return Response({'error': 'Employee not found with the provided email'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
            print("Exception in role_id 3 block:", traceback.format_exc())
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)







