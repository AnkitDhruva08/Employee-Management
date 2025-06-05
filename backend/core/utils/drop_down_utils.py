from core.models import Project
from core.serializers import ProjectDropdownSerializer, ProjectSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from core.models import Company, Project, Employee, Bug, Notification
from core.serializers import EmployeeProjectSerializer, ProjectSerializer, BugSerializer
from django.contrib.auth import get_user_model
from django.db.models.functions import Concat
from django.db.models import Q, Avg, Max, F, Value, CharField
from core.utils.pagination import CustomPagination


User = get_user_model()

class ProjectDropDownView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_data = User.objects.get(email=user.email)
        print('emial:', user_data)
        print('ankit mishra for dropdwon')

        try:
            if user_data.is_employee:
                try:
                    employee = Employee.objects.get(company_email=user.email)
                except Employee.DoesNotExist:
                    # Employee record not found - return empty projects list instead of error
                    return Response({"projects": []}, status=status.HTTP_200_OK)

                company = Company.objects.get(id=employee.company_id)

            elif user_data.is_company:
                print('is company', user_data.email)
                company = Company.objects.get(email=user_data.email)
                print('company:', company)
            else:
                return Response({"error": "Unauthorized user type."}, status=status.HTTP_403_FORBIDDEN)

            # Fetch active projects - will be empty queryset if none
            projects = Project.objects.filter(company_id=company.id, active=True).order_by('project_name')
            serializer = ProjectDropdownSerializer(projects, many=True)
            return Response({"projects": serializer.data}, status=status.HTTP_200_OK)

        except Company.DoesNotExist:
            return Response({"error": "Company not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": "Unexpected error", "detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class EmployeeDropDownView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_data = User.objects.get(email=user.email)

        try:
            # Determine the company based on whether the user is an employee or company admin
            if user_data.is_employee:
                employee = Employee.objects.get(company_email=user.email)
                # Ensure we get the actual Company instance (if employee.company is not a FK)
                company = Company.objects.get(id=employee.company_id) 
            else:
                company = Company.objects.get(id=user_data.company_id)

            # Fetch all active projects for the company
            projects = Project.objects.filter(company_id=company.id, active=True).order_by('project_name')
            serializer = EmployeeProjectSerializer(projects, many=True)
            return Response({"projects": serializer.data}, status=status.HTTP_200_OK)

        except (Employee.DoesNotExist, Company.DoesNotExist):
            return Response({"error": "Company or employee not found."}, status=status.HTTP_404_NOT_FOUND)