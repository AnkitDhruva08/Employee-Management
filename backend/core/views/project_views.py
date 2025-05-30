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
from core.utils.filter_utils import apply_common_filters

User = get_user_model()

class ProjectManagement(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        user_data = User.objects.get(email=user.email)
        company_id = None
        paginator = CustomPagination()

        if user_data.is_employee:
            try:
                employee_data = Employee.objects.get(company_email=user.email)
                role_id = employee_data.role_id
                company_id = employee_data.company_id
                employee_id = employee_data.id

                if role_id == 3:
                    projects = Project.objects.filter(
                        active=True,
                        company__active=True,
                        tasks__active=True,
                        tasks__members__id=employee_id
                    ).annotate(
                        progress=Avg('tasks__progress'),
                        team_leader=Concat(
                            F('tasks__team_lead__first_name'),
                            Value(' '),
                            F('tasks__team_lead__middle_name'),
                            Value(' '),
                            F('tasks__team_lead__last_name'),
                            output_field=CharField()
                        )
                    ).values(
                        'id', 'project_name', 'description',
                        'start_date', 'end_date', 'progress',
                        'status', 'team_leader'
                    ).distinct().order_by('-start_date')

                    projects = apply_common_filters(projects, request)
                    paginated_projects = paginator.paginate_queryset(projects, request)
                    return paginator.get_paginated_response(paginated_projects)

            except Employee.DoesNotExist:
                return Response({"detail": "Employee data not found"}, status=status.HTTP_404_NOT_FOUND)

        elif user_data.is_company:
            company_id = user_data.id
        else:
            return Response({"detail": "Unauthorized user type"}, status=status.HTTP_403_FORBIDDEN)

        projects = Project.objects.filter(company_id=company_id, active=True).order_by('-id')
        projects = apply_common_filters(projects, request)
        paginated_projects = paginator.paginate_queryset(projects, request)
        serializer = ProjectSerializer(paginated_projects, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request, *args, **kwargs):
        user_details = request.user
        company_id = None

        if hasattr(user_details, 'is_employee') and user_details.is_employee:
            try:
                employee_data = Employee.objects.get(company_email=user_details.email)
                role_id = employee_data.role_id
                company_id = employee_data.company_id
                if role_id != 1:
                    return Response({"detail": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            except Employee.DoesNotExist:
                return Response({"detail": "Employee data not found"}, status=status.HTTP_404_NOT_FOUND)

        elif hasattr(user_details, 'is_company') and user_details.is_company:
            company_id = user_details.id
        else:
            return Response({"detail": "Unauthorized user type"}, status=status.HTTP_403_FORBIDDEN)

        try:
            design_available = request.data.get('designAvailable', False)
            if isinstance(design_available, str):
                design_available = design_available.lower() == 'true'

            project = Project.objects.create(
                company_id=company_id,
                project_name=request.data.get('project_name'),
                description=request.data.get('description'),
                start_date=request.data.get('startDate'),
                end_date=request.data.get('endDate'),
                status=request.data.get('status'),
                phase=request.data.get('phase', ''),
                company_name=request.data.get('companyName', ''),
                client_name=request.data.get('clientName', ''),
                design_available=design_available,
                created_by=user_details,
                updated_by=user_details,
            )

            if request.FILES.get('srsFile') and request.FILES['srsFile'].name != 'null':
                project.srs_file = request.FILES['srsFile']
            if request.FILES.get('wireframeFile') and request.FILES['wireframeFile'].name != 'null':
                project.wireframe_file = request.FILES['wireframeFile']
            project.save()

            assigned_to_raw = request.data.getlist('assignedTo') or request.data.getlist('assignedTo[]')
            if assigned_to_raw:
                assigned_to_ids = [int(item) for item in assigned_to_raw if item.isdigit()]
                employees = Employee.objects.filter(id__in=assigned_to_ids)
                project.assigned_to.set(employees)

                # 🔔 Notify each employee
                for emp in employees:
                    if emp.user:
                        print('i am here')
                        # Create a notification for each employee

                        print(f"✅ Sending notification to {emp.user.email} for project '{project.project_name}'")
                        Notification.objects.create(
                            user=emp.user,
                            message=f"You have been assigned to the project '{project.project_name}'.",
                            notification_type="project",
                            url=f"/projects/{project.id}/"
                        )
                        print(f"✅ Notification sent to {emp.user.email}")
                

            serializer = ProjectSerializer(project)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            print("Error creating project:", e)
            return Response({"detail": "Internal Server Error", "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, pk):
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

        try:
            project = Project.objects.get(id=pk, company_id=company_id, active=True)
        except Project.DoesNotExist:
            return Response({"detail": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()

        key_map = {
            'projectName': 'project_name',
            'startDate': 'start_date',
            'endDate': 'end_date',
            'companyName': 'company_name',
            'clientName': 'client_name',
            'designAvailable': 'design_available',
        }

        for old_key, new_key in key_map.items():
            if old_key in data:
                value = data.pop(old_key)
                if isinstance(value, (list, tuple)) and len(value) == 1:
                    value = value[0]
                data[new_key] = value

        if 'design_available' in data:
            val = data['design_available']
            data['design_available'] = val.lower() == 'true' if isinstance(val, str) else bool(val)

        for k in list(data.keys()):
            if data[k] in [None, '', 'null']:
                data.pop(k)

        serializer = ProjectSerializer(project, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()

            if request.FILES.get('srsFile') and request.FILES['srsFile'].name != 'null':
                project.srs_file = request.FILES['srsFile']
            if request.FILES.get('wireframeFile') and request.FILES['wireframeFile'].name != 'null':
                project.wireframe_file = request.FILES['wireframeFile']
            project.save()

            assigned_to_raw = request.data.getlist('assignedTo') or request.data.getlist('assignedTo[]')
            if assigned_to_raw:
                assigned_to_ids = [int(i) for i in assigned_to_raw if i.isdigit()]
                employees = Employee.objects.filter(id__in=assigned_to_ids)
                project.assigned_to.set(employees)

                # 🔔 Notify updated employees
                for emp in employees:
                    if emp.user:
                        Notification.objects.create(
                            user=emp.user,
                            message=f"Project '{project.project_name}' has been updated and you're assigned to it.",
                            notification_type="project",
                            url=f"/projects/{project.id}/"
                        )
                        print(f"🔄 Notification sent to {emp.user.email} (update)")
            else:
                project.assigned_to.clear()

            serializer = ProjectSerializer(project)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


        





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

                # Handle Role 3: Basic employee
                if role_id == 3:
                    bugs = Bug.objects.filter(
                        active=True,
                        company__active=True,
                        project__active=True,
                        assigned_to=employee_data  
                    ).select_related('project', 'company').order_by('-id')

                    bugs_filter = apply_common_filters(bugs, request)
                    serializer = BugSerializer(bugs_filter, many=True)
                    return Response(serializer.data, status=status.HTTP_200_OK)

                # Other employees (e.g., Admin/Manager)
                if role_id != 1:
                    return Response({"detail": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

            except Employee.DoesNotExist:
                return Response({"detail": "Employee data not found"}, status=status.HTTP_404_NOT_FOUND)

        elif user_data.is_company:
            company_id = user_data.id
        else:
            return Response({"detail": "Unauthorized user type"}, status=status.HTTP_403_FORBIDDEN)

        # For company admins
        bugs = Bug.objects.filter(company_id=company_id, active=True).order_by('-id')
        bugs_filter = apply_common_filters(bugs, request)
        serializer = BugSerializer(bugs_filter, many=True)
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


