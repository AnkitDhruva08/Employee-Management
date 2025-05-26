from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from core.models import Company, Project, Employee, Bug
from core.serializers import ProjectSerializer, BugSerializer
from django.contrib.auth import get_user_model 
from django.db.models import F, Value, CharField
from django.db.models.functions import Concat
# User Model
User = get_user_model()

class ProjectManagement(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        user = request.user
        print('user ==<<<>>', user)
        user_data = User.objects.get(email=user.email)
        print('user_data ==<<<>>', user_data)
        company_id = None

        #  if user is admin
        if user_data.is_employee:
            try:
                employee_data = Employee.objects.get(company_email=user.email)
                role_id = employee_data.role_id
                company_id = employee_data.company_id
                print('role_id ==<<<>>', role_id)
                employee_id = employee_data.id
                print('employee_id ==<<<>>', employee_id)
                # Only allow role_id 1 (admin) to fetch projects
                if role_id == 3:
                    projects = Project.objects.filter(
                        active=True,
                        company__active=True,
                        tasks__active=True,
                        tasks__members__id=employee_id
                    ).annotate(
                        project_status=F('status'),
                        project_description=F('description'),
                        project_start_date=F('start_date'),
                        project_end_date=F('end_date'),
                        progress=F('tasks__progress'),
                        team_leader=Concat(
                            F('tasks__team_lead__first_name'),
                            Value(' '),
                            F('tasks__team_lead__middle_name'),
                            Value(' '),
                            F('tasks__team_lead__last_name'),
                            output_field=CharField()
                        )
                    ).values(
                        'project_name',
                        'project_status',
                        'project_description',
                        'project_start_date',
                        'project_end_date',
                        'team_leader',
                        'progress'
                    )
                    return Response(projects, status=status.HTTP_200_OK)
                
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
        





# For Bugs Report
class BugsReportsA(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        user_data = User.objects.get(email=user.email)

        company_id = None

        if user_data.is_employee:
            try:
                employee_data = Employee.objects.get(company_email=user.email)
                role_id = employee_data.role_id
                company_id = employee_data.company_id

                if role_id != 1:
                    return Response({"detail": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

            except Employee.DoesNotExist:
                return Response({"detail": "Employee data not found"}, status=status.HTTP_404_NOT_FOUND)

        elif user_data.is_company:
            company_id = user_data.id
        else:
            return Response({"detail": "Unauthorized user type"}, status=status.HTTP_403_FORBIDDEN)

        bugs = Bug.objects.filter(company_id=company_id, active=True).order_by('-id')
        serializer = BugSerializer(bugs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
            user = request.user

            # Get user data
            try:
                user_data = User.objects.get(email=user.email)
            except User.DoesNotExist:
                return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

            # Determine company ID
            if user_data.is_employee:
                try:
                    employee_data = Employee.objects.get(company_email=user.email)
                    if employee_data.role_id != 1:
                        return Response({"detail": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
                    company_id = employee_data.company_id
                except Employee.DoesNotExist:
                    return Response({"detail": "Employee data not found"}, status=status.HTTP_404_NOT_FOUND)
            elif user_data.is_company:
                company_id = user_data.id
            else:
                return Response({"detail": "Unauthorized user type"}, status=status.HTTP_403_FORBIDDEN)

            # Clean and prepare the data
            data = request.data.copy()

            # 🔐 Ensure 'id' is not passed to prevent conflict
            data.pop('id', None)

            # 🛠 Transform frontend field names to match model fields
            data['company'] = company_id
            data['project'] = data.pop('projectId', None)
            data.pop('id', None)

            # Assigned to - convert list of objects to list of IDs
            if 'assignedTo' in data:
                data['assigned_to'] = [item['value'] for item in data.get('assignedTo', [])]
            else:
                data['assigned_to'] = []

            # Serialize and save
            serializer = BugSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            


    def put(self, request, pk):
        user = request.user

        # Get user data
        try:
            user_data = User.objects.get(email=user.email)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # Determine company ID
        if user_data.is_employee:
            try:
                employee_data = Employee.objects.get(company_email=user.email)
                if employee_data.role_id != 1:
                    return Response({"detail": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
                company_id = employee_data.company_id
            except Employee.DoesNotExist:
                return Response({"detail": "Employee data not found"}, status=status.HTTP_404_NOT_FOUND)
        elif user_data.is_company:
            company_id = user_data.id
        else:
            return Response({"detail": "Unauthorized user type"}, status=status.HTTP_403_FORBIDDEN)

        # Fetch the bug and check company ownership
        try:
            bug = Bug.objects.get(id=pk, company_id=company_id, active=True)
        except Bug.DoesNotExist:
            return Response({"detail": "Bug not found"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data.pop('id', None)
        data['company'] = company_id
        data['project'] = data.pop('projectId', None)

        if 'assignedTo' in data:
            data['assigned_to'] = [item['value'] for item in data.get('assignedTo', [])]
        else:
            data['assigned_to'] = []

        serializer = BugSerializer(bug, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        


    def delete(self, request, pk):
        user = request.user
        print('pk for detelet')

        # Get user data
        try:
            user_data = User.objects.get(email=user.email)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # Determine company ID
        if user_data.is_employee:
            try:
                employee_data = Employee.objects.get(company_email=user.email)
                if employee_data.role_id != 1:
                    return Response({"detail": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
                company_id = employee_data.company_id
            except Employee.DoesNotExist:
                return Response({"detail": "Employee data not found"}, status=status.HTTP_404_NOT_FOUND)
        elif user_data.is_company:
            company_id = user_data.id
        else:
            return Response({"detail": "Unauthorized user type"}, status=status.HTTP_403_FORBIDDEN)

        try:
            bug = Bug.objects.get(id=pk, company_id=company_id, active=True)
        except Bug.DoesNotExist:
            return Response({"detail": "Bug not found"}, status=status.HTTP_404_NOT_FOUND)

        bug.active = False  # Soft delete
        bug.save()
        return Response({"detail": "Bug marked as inactive"}, status=status.HTTP_204_NO_CONTENT)


