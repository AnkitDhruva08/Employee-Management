from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from core.models import Company, Project, Employee
from core.serializers import ProjectSerializer
from django.contrib.auth import get_user_model 

# User Model
User = get_user_model()

class ProjectManagement(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        user = request.user
        user_data = User.objects.get(email=user.email)

        company_id = None

        #  if user is admin
        if user_data.is_employee:
            try:
                employee_data = Employee.objects.get(company_email=user.email)
                role_id = employee_data.role_id
                company_id = employee_data.company_id
                # Only allow role_id 1 (admin) to fetch projects
                if role_id != 1:
                    return Response({"detail": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

            except Employee.DoesNotExist:
                return Response({"detail": "Employee data not found"}, status=status.HTTP_404_NOT_FOUND)

        #  if user is company 
        elif user_data.is_company:
            company_id = user_data.id

        else:
            return Response({"detail": "Unauthorized user type"}, status=status.HTTP_403_FORBIDDEN)

        # Common logic for both employee admin and company
        projects = Project.objects.filter(company_id=company_id, active=True).order_by('-id')
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    


    def post(self, request, *args, **kwargs):
        print('data coming from frontend ==<<<>>', request.data)

        user_details = User.objects.get(email=request.user.email)
        company_id = None

        # If user is an employee
        if user_details.is_employee:
            try:
                employee_data = Employee.objects.get(company_email=request.user.email)
                role_id = employee_data.role_id
                company_id = employee_data.company_id
                if role_id != 1:
                    return Response({"detail": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            except Employee.DoesNotExist:
                return Response({"detail": "Employee data not found"}, status=status.HTTP_404_NOT_FOUND)

        # If user is a company
        elif user_details.is_company:
            company_id = user_details.id
        else:
            return Response({"detail": "Unauthorized user type"}, status=status.HTTP_403_FORBIDDEN)

        try:
            project = Project.objects.create(
                company_id=company_id,
                project_name=request.data.get('project_name'),
                description=request.data.get('description'),
                start_date=request.data.get('startDate'),  
                end_date=request.data.get('endDate'),    
                status=request.data.get('status')
            )
            serializer = ProjectSerializer(project)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            print("Error creating project:", e)
            return Response({"detail": "Internal Server Error", "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



