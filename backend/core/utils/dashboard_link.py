from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from core.utils.utils import is_profile_complete
from core.models import  Company, Employee, EmployeeDashboardLink, Event, HrDashboardLink, CompanyDashboardLink, LeaveRequest
from core.serializers import EmployeeDashboardLinkSerializer, HrDashboardLinkSerializer, CompanyDashboardLinkSerializer
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import F, Value, CharField
from django.db.models.functions import Concat
import traceback
from django.shortcuts import get_object_or_404
from datetime import date



def dashboard_links(role_id, is_company, email):
    try:
        data = {}
        company_id = None 

        if is_company:
            dashboard_links = CompanyDashboardLink.objects.filter(active=True).order_by("id")
            company_obj = Company.objects.get(email=email)  # FIXED: renamed from `company`
            company_id = company_obj.id
            serializer = CompanyDashboardLinkSerializer(dashboard_links, many=True)

            total_employees = Employee.objects.filter(company_id=company_id).count()
            total_leave_requests = LeaveRequest.objects.filter(employee__company_id=company_id).count()
            upcoming_events = Event.objects.filter(company_id=company_id, date__gte=date.today()) \
                                           .values('title', 'date')

            data.update({
                "dashboard_links": serializer.data,
                "total_employees": total_employees,
                "total_leave_requests": total_leave_requests,
                "upcoming_events": list(upcoming_events)
            })

            return Response(data, status=status.HTTP_200_OK)

        elif role_id == 2:
            dashboard_links = HrDashboardLink.objects.filter(active=True).order_by("id")
            serializer = HrDashboardLinkSerializer(dashboard_links, many=True)

            # Try to fetch company via email for HR user (assumed linked through Employee)
            employee = Employee.objects.get(company_email=email)
            company_id = employee.company_id

            total_employees = Employee.objects.filter(company_id=company_id).count()
            total_leave_requests = LeaveRequest.objects.filter(employee__company_id=company_id).count()
            upcoming_events = Event.objects.filter(company_id=company_id, date__gte=date.today()) \
                                           .values('title', 'date')

            data.update({
                "dashboard_links": serializer.data,
                "total_employees": total_employees,
                "total_leave_requests": total_leave_requests,
                "upcoming_events": list(upcoming_events)
            })

            return Response(data, status=status.HTTP_200_OK)

        elif role_id == 3:
            try:
                try:
                    employee = Employee.objects.get(company_email=email)
                    employee_id = employee.id
                    print('employee_id', employee_id)
                except Employee.DoesNotExist:
                    return Response({'error': 'Employee not found with the provided email'}, status=status.HTTP_404_NOT_FOUND)

                result = is_profile_complete(employee_id)
                if not isinstance(result, dict) or 'is_complete' not in result or 'message' not in result or 'missing_sections' not in result:
                    return Response({'error': 'Unexpected response from is_profile_complete function'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                print('result', result)

                dashboard_links = EmployeeDashboardLink.objects.filter(active=True).order_by("id")

                if not result['is_complete']:
                    # Make sure this field exists in your model!
                    restricted_titles = ["Leave", "Holiday Calendar", "Payslips", "Attendance Overview"]
                    restricted_field = "name"  # Replace 'name' with the correct field name in EmployeeDashboardLink
                    dashboard_links = dashboard_links.exclude(**{f"{restricted_field}__in": restricted_titles})
                    
                    serializer = EmployeeDashboardLinkSerializer(dashboard_links, many=True)
                    return Response({
                        "is_complete": False,
                        "message": result['message'],
                        "missing_sections": result['missing_sections'],
                        "dashboard_links": serializer.data
                    }, status=status.HTTP_200_OK)

                serializer = EmployeeDashboardLinkSerializer(dashboard_links, many=True)
                return Response({
                    "success": True,
                    "dashboard_links": serializer.data
                }, status=status.HTTP_200_OK)

            except Exception as e:
                import traceback
                print("Exception in role_id 3 block:", traceback.format_exc())  # Logs full stack trace
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



        else:
            return Response({"error": "Invalid role_id or access"}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)






