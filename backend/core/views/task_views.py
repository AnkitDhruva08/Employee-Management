from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from core.models import Company, Project, Employee, Bug, Task
from core.serializers import ProjectSerializer, BugSerializer, TaskSerializer
from django.contrib.auth import get_user_model 
from datetime import date
from core.utils.filter_utils import apply_common_filters

# User Model
User = get_user_model()

class TaskManagementViews(APIView):
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

                if role_id != 1: # Assuming role_id 1 is admin
                    return Response({"detail": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

            except Employee.DoesNotExist:
                return Response({"detail": "Employee data not found"}, status=status.HTTP_404_NOT_FOUND)

        elif user_data.is_company:
            company_data = Company.objects.get(user_id=user_data.id)
            company_id = company_data.id
        else:
            return Response({"detail": "Unauthorized user type"}, status=status.HTTP_403_FORBIDDEN)

        # Ensure 'company_id' is correctly retrieved and used.
        tasks = Task.objects.filter(company_id=company_id, active=True).order_by('-id')

        # Apply filters using your helper function
        tasks_data = apply_common_filters(tasks, request)

        serializer = TaskSerializer(tasks_data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


    

    def post(self, request, *args, **kwargs):
        user = request.user
        # Get user data
        print('data is commig from frontend ==<<>>', request.data)
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
            company_data = Company.objects.get(user_id=user_data.id)
            company_id = company_data.id
        else:
            return Response({"detail": "Unauthorized user type"}, status=status.HTTP_403_FORBIDDEN)

        # Clean and prepare the data
        data = request.data.copy()
        data.pop('id', None)
        data['company'] = company_id

        # Convert teamLead object to team_lead ID
        if 'teamLead' in data and isinstance(data['teamLead'], dict):
            data['team_lead'] = data['teamLead'].get('value')
        data.pop('teamLead', None)

        # Convert project object to ID
        if 'project' in data and isinstance(data['project'], dict):
            data['project'] = data['project'].get('value')


        task_status = data['status']
        data['status'] = task_status

        # Convert members list of objects to list of IDs
        if 'members' in data:
            members = data.get('members', [])

            if all(isinstance(item, dict) and 'value' in item for item in members):
                members_list = [item['value'] for item in members]
                data['members'] = members_list
            elif all(isinstance(item, int) for item in members):
                # Case: members is a list of integers
                print('Members are already raw integers:', members)

            else:
                # Invalid format
                return Response({"detail": "Invalid format for members."}, status=status.HTTP_400_BAD_REQUEST)

            # Final check
            if not data['members']:
                return Response({"detail": "At least one member is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Final serializer call
        serializer = TaskSerializer(data=data)
        

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            print('error ==<<>', serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    #  function update 
    def put(self, request, pk):
        user = request.user
        print('data comming from frontend ==<<>>', request.data)


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
            company_data = Company.objects.get(user_id=user_data.id)
            company_id = company_data.id
        else:
            return Response({"detail": "Unauthorized user type"}, status=status.HTTP_403_FORBIDDEN)

        # Fetch the task
        try:
            task = Task.objects.get(id=pk, company_id=company_id, active=True)
        except Task.DoesNotExist:
            return Response({"detail": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

        # Prepare data for update
        data = request.data.copy()
        data.pop('id', None)
        data['company'] = company_id

        # Convert frontend nested fields
        if 'teamLead' in data and isinstance(data['teamLead'], dict):
            data['team_lead'] = data['teamLead'].get('value')
        data.pop('teamLead', None)
        if 'project' in data:
            if isinstance(data['project'], dict):
                data['project'] = data['project'].get('value')

        task_status = data['status']
        data['status'] = task_status
        if 'members' in data:
            members = data.get('members', [])

            if all(isinstance(item, dict) and 'value' in item for item in members):
                members_list = [item['value'] for item in members]
                data['members'] = members_list
            elif all(isinstance(item, int) for item in members):
                # Case: members is a list of integers
                print('Members are already raw integers:', members)

            else:
                # Invalid format
                return Response({"detail": "Invalid format for members."}, status=status.HTTP_400_BAD_REQUEST)

            # Final check
            if not data['members']:
                return Response({"detail": "At least one member is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Update the task
        serializer = TaskSerializer(task, data=data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            print('serializer.errors ==<>>', serializer.errors) 
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        


    def delete(self, request, pk):
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

        try:
            task = Task.objects.get(id=pk, company_id=company_id, active=True)
        except Task.DoesNotExist:
            return Response({"detail": "Bug not found"}, status=status.HTTP_404_NOT_FOUND)

        task.active = False  
        task.save()
        return Response({"detail": "Bug marked as inactive"}, status=status.HTTP_204_NO_CONTENT)




class TaskTrackingViews(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        tasks = Task.objects.filter(
            active=True,
        ).select_related('project').order_by('id')

        print(f"[DEBUG] Number of active tasks assigned to employee: {tasks.count()}")

        data = []
        today = date.today()
        print(f"[DEBUG] Today's date: {today}")

        for task in tasks:
            project = task.project
            print(f"[DEBUG] Processing Task ID: {task.id}, Name: {task.task_name}")
            if project:
                print(f"[DEBUG] -> Related Project ID: {project.id}, Name: {project.project_name}")
            else:
                print("[DEBUG] -> No related project for this task")

            data.append({
                "task_id": task.id,
                "task_name": task.task_name,
                "status": task.status,
                "progress": task.progress,
                "description": task.description,
                "project_id": project.id if project else None,
                "project_name": project.project_name if project else None,
                "project_status": project.status if project else None,
            })

        print(f"[DEBUG] Total tasks returned: {len(data)}")
        return Response(data)