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
            serializer = ProjectDropdownSerializer(projects, many=True)
            return Response({"projects": serializer.data}, status=status.HTTP_200_OK)

        except (Employee.DoesNotExist, Company.DoesNotExist):
            return Response({"error": "Company or employee not found."}, status=status.HTTP_404_NOT_FOUND)
        



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