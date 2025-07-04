from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from core.models import Company, Project, Employee, Bug, Task, Notification
from core.serializers import ProjectSerializer, BugSerializer, TaskSerializer
from django.contrib.auth import get_user_model 
from datetime import date
from core.utils.filter_utils import apply_common_filters
from django.db.models import Q
from core.utils.kafka_producer import send_to_kafka  
# User Model
User = get_user_model()

class TaskManagementViews(APIView):
    permission_classes = [IsAuthenticated]
        
    def get(self, request, pk=None):
        user = request.user
        try:
            user_data = User.objects.get(email=user.email)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        company_id = None

        if user_data.is_employee:
            try:
                employee_data = Employee.objects.get(company_email=user.email)
                role_id = employee_data.role_id
                company_id = employee_data.company_id

                if role_id not in [1, 2]:
                    tasks = Task.objects.filter(
                        Q(members=employee_data.id) | Q(team_lead=employee_data.id),
                        company=company_id,
                        active=True
                    ).order_by('-id')

                    if pk:
                        task = tasks.filter(id=pk).first()
                        if not task:
                            return Response({"detail": "Task not found"}, status=status.HTTP_404_NOT_FOUND)
                        serializer = TaskSerializer(task)
                        return Response(serializer.data, status=status.HTTP_200_OK)
                    
                    tasks_data = apply_common_filters(tasks, request)
                    serializer = TaskSerializer(tasks_data, many=True)
                    return Response(serializer.data, status=status.HTTP_200_OK)

            except Employee.DoesNotExist:
                return Response({"detail": "Employee data not found"}, status=status.HTTP_404_NOT_FOUND)

        elif user_data.is_company:
            try:
                company_data = Company.objects.get(user_id=user_data.id)
                company_id = company_data.id
            except Company.DoesNotExist:
                return Response({"detail": "Company data not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"detail": "Unauthorized user type"}, status=status.HTTP_403_FORBIDDEN)

        # For role 1 or 2 employee or company user
        base_tasks = Task.objects.filter(company_id=company_id, active=True).order_by('-id')

        if pk:
            task = base_tasks.filter(id=pk).first()
            if not task:
                return Response({"detail": "Task not found"}, status=status.HTTP_404_NOT_FOUND)
            serializer = TaskSerializer(task)
            return Response(serializer.data, status=status.HTTP_200_OK)

        tasks_data = apply_common_filters(base_tasks, request)
        serializer = TaskSerializer(tasks_data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    
    def post(self, request, *args, **kwargs):
        user = request.user

        try:
            user_data = User.objects.get(email=user.email)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # Get company
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

        data = request.data.copy()
        data.pop('id', None)
        data['company'] = company_id

        # Handle nested data
        if 'teamLead' in data and isinstance(data['teamLead'], dict):
            data['team_lead'] = data['teamLead'].get('value')
        data.pop('teamLead', None)

        if 'project' in data and isinstance(data['project'], dict):
            data['project'] = data['project'].get('value')

        # Handle members
        if 'members' in data:
            members = data['members']
            if all(isinstance(item, dict) and 'value' in item for item in members):
                data['members'] = [item['value'] for item in members]
            elif not all(isinstance(item, int) for item in members):
                return Response({"detail": "Invalid format for members."}, status=status.HTTP_400_BAD_REQUEST)
            if not data['members']:
                return Response({"detail": "At least one member is required."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = TaskSerializer(data=data)

        if serializer.is_valid():
            task = serializer.save(created_by=user_data)

            # Notify members
            for emp in Employee.objects.filter(id__in=data['members']):
                if emp.user:
                    send_to_kafka('notifications', {
                        "user_id": emp.user.id,
                        "message": f"You have been assigned to task: '{task.task_name}' by {user_data.username}",
                        "type": "task",
                        "url": f"/task-dashboard/{task.id}/"
                    })

            # Notify team lead if not a member
            if task.team_lead and task.team_lead.id not in data['members']:
                if task.team_lead.user:
                    send_to_kafka('notifications', {
                        "user_id": task.team_lead.user.id,
                        "message": f"You are leading a new task: '{task.task_name}' (created by {user_data.username})",
                        "type": "task",
                        "url": f"/task-dashboard/{task.id}/"
                    })

            return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    def put(self, request, pk):
        user = request.user
        try:
            user_data = User.objects.get(email=user.email)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if user_data.is_employee:
            try:
                employee_data = Employee.objects.get(company_email=user.email)
                company_id = employee_data.company_id
            except Employee.DoesNotExist:
                return Response({"detail": "Employee data not found"}, status=status.HTTP_404_NOT_FOUND)
        elif user_data.is_company:
            company_data = Company.objects.get(user_id=user_data.id)
            company_id = company_data.id
        else:
            return Response({"detail": "Unauthorized user type"}, status=status.HTTP_403_FORBIDDEN)

        try:
            task = Task.objects.get(id=pk, company_id=company_id, active=True)
        except Task.DoesNotExist:
            return Response({"detail": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

        old_members = list(task.members.values_list('id', flat=True))
        old_team_lead = task.team_lead.id if task.team_lead else None
        old_status = task.status
        old_project = task.project.id if task.project else None

        data = request.data.copy()
        data.pop('id', None)
        data['company'] = company_id

        if 'teamLead' in data and isinstance(data['teamLead'], dict):
            data['team_lead'] = data['teamLead'].get('value')
        data.pop('teamLead', None)

        if 'project' in data and isinstance(data['project'], dict):
            data['project'] = data['project'].get('value')

        if 'members' in data:
            members = data['members']
            if all(isinstance(item, dict) and 'value' in item for item in members):
                data['members'] = [item['value'] for item in members]
            elif not all(isinstance(item, int) for item in members):
                return Response({"detail": "Invalid format for members."}, status=status.HTTP_400_BAD_REQUEST)
            if not data['members']:
                return Response({"detail": "At least one member is required."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = TaskSerializer(task, data=data, partial=True)

        if serializer.is_valid():
            updated_task = serializer.save(updated_by=user_data)

            new_members = data.get('members', old_members)
            new_team_lead = updated_task.team_lead.id if updated_task.team_lead else None
            new_status = updated_task.status
            new_project = updated_task.project.id if updated_task.project else None

            task_name = updated_task.task_name
            task_url = f"/task-dashboard/{updated_task.id}/"

            added_members = set(new_members) - set(old_members)
            removed_members = set(old_members) - set(new_members)
            still_members = set(old_members).intersection(new_members)

            for emp in Employee.objects.filter(id__in=removed_members):
                if emp.user:
                    send_to_kafka('notifications', {
                        "user_id": emp.user.id,
                        "message": f"You have been removed from task '{task_name}' by {user_data.username}",
                        "type": "task",
                        "url": task_url
                    })

            for emp in Employee.objects.filter(id__in=added_members):
                if emp.user:
                    send_to_kafka('notifications', {
                        "user_id": emp.user.id,
                        "message": f"You have been assigned to task: '{task_name}' by {user_data.username}",
                        "type": "task",
                        "url": task_url
                    })

            if old_status != new_status or old_project != new_project or old_team_lead != new_team_lead:
                for emp in Employee.objects.filter(id__in=still_members):
                    if emp.user:
                        send_to_kafka('notifications', {
                            "user_id": emp.user.id,
                            "message": f"Task '{task_name}' was updated by {user_data.username}",
                            "type": "task",
                            "url": task_url
                        })

            if old_team_lead != new_team_lead:
                if old_team_lead:
                    old_lead = Employee.objects.filter(id=old_team_lead).first()
                    if old_lead and old_lead.user:
                        send_to_kafka('notifications', {
                            "user_id": old_lead.user.id,
                            "message": f"You are no longer the team lead for task '{task_name}' (changed by {user_data.username})",
                            "type": "task",
                            "url": task_url
                        })
                if new_team_lead:
                    new_lead = Employee.objects.filter(id=new_team_lead).first()
                    if new_lead and new_lead.user:
                        send_to_kafka('notifications', {
                            "user_id": new_lead.user.id,
                            "message": f"You are now the team lead for task '{task_name}' (updated by {user_data.username})",
                            "type": "task",
                            "url": task_url
                        })

            return Response(TaskSerializer(updated_task).data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    def delete(self, request, pk):
        user = request.user
        print('pk =<<<>>', pk)
        try:
            user_data = User.objects.get(email=user.email)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        print('user_data =<<>>', user_data)
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

        try:
            task = Task.objects.get(id=pk, company_id=company_id, active=True)
        except Task.DoesNotExist:
            return Response({"detail": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

        print('ankit mishra')
        task.active = False
        task.updated_by = user_data
        task.save()

        for emp in task.members.all():
            if emp.user:
                send_to_kafka('notifications', {
                    "user_id": emp.user.id,
                    "message": f"Task '{task.task_name}' was deleted by {user_data.username}",
                    "type": "task",
                    "url": f"/task-dashboard/{task.id}/"
                })

        return Response({"detail": "Task marked as inactive"}, status=status.HTTP_204_NO_CONTENT)


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
    










