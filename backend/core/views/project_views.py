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
from django.db import transaction
from core.utils.kafka_producer import send_to_kafka  
User = get_user_model()

class ProjectManagement(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        user = request.user
        paginator = CustomPagination()
        is_company = False
        is_employee = False
        user_data = User.objects.get(email=user.email)
        is_company = user_data.is_company
        is_employee = user_data.is_employee

        try:
            # Initialize variables
            base_queryset = Project.objects.none()
            filtered_queryset = Project.objects.none()
            company_id = None

            # EMPLOYEE FLOW
            if user_data.is_employee:
                employee = Employee.objects.get(company_email=user.email)
                role_id = employee.role_id
                employee_id = employee.id
                company_id = employee.company_id

                # Role 3: Assigned projects only
                if role_id == 3:
                    base_queryset = Project.objects.filter(
                    active=True,
                    company_id=company_id,
                    assigned_to__id=employee_id
                ).distinct().order_by('-start_date')

                # Role 1: Company Admin - see all
                elif role_id in [1, 2] or is_company:
                    base_queryset = Project.objects.filter(
                        company_id=company_id,
                        active=True
                    ).order_by('-id')
                else:
                    return Response({"detail": "Unauthorized role"}, status=403)

            # COMPANY ADMIN FLOW
            elif user_data.is_company:
                company = Company.objects.get(email=user_data.email)
                company_id = company.id
                base_queryset = Project.objects.filter(
                    company_id=company_id,
                    active=True
                ).order_by('-id')

            else:
                return Response({"detail": "Unauthorized access"}, status=403)

            # Apply filters
            filtered_queryset = apply_common_filters(base_queryset, request)

            # If pk is provided → return specific project if visible to user
            if pk:
                project = filtered_queryset.filter(id=pk).first()
                if not project:
                    return Response({"detail": "Project not found or unauthorized"}, status=404)
                serializer = ProjectSerializer(project)
                return Response(serializer.data)

            # Count statistics
            total_count = base_queryset.count()
            filtered_count = filtered_queryset.count()
            status_counts = {
                "In Progress": filtered_queryset.filter(status='In Progress').count(),
                "Done": filtered_queryset.filter(status='Done').count(),
                "Blocked": filtered_queryset.filter(status='Blocked').count(),
                "Planned": filtered_queryset.filter(status='Planned').count(),
                "On Hold": filtered_queryset.filter(status='On Hold').count(),
            }

            # Check if all results should be returned
            all_flag = request.query_params.get("all", "false").lower() == "true"

            if all_flag:
                serializer = ProjectSerializer(filtered_queryset, many=True)
                return Response({
                    "total_count": total_count,
                    "filtered_count": filtered_count,
                    **status_counts,
                    "results": serializer.data
                })

            # Paginated response
            paginated = paginator.paginate_queryset(filtered_queryset, request)
            serializer = ProjectSerializer(paginated, many=True)
            paginated_response = paginator.get_paginated_response(serializer.data, total_count=total_count)
            paginated_response.data.update({
                "filtered_count": filtered_count,
                **status_counts,
            })

            return paginated_response

        except Employee.DoesNotExist:
            return Response({"detail": "Employee record not found"}, status=404)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)
        except Exception as e:
            print("Error in ProjectListView GET:", e)
            return Response({"detail": "Internal Server Error", "error": str(e)}, status=500)

# function for creating project
    def post(self, request, *args, **kwargs):
        user_details = request.user
        user_data = User.objects.get(email=user_details.email)
        print('user_details user name ==<<>', user_details.username)
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
            company_data = Company.objects.get(email=user_details.email)
            company_id = company_data.id
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
                        print(f"✅ Sending notification to {emp.company_email} for project '{project.project_name}'")
                        send_to_kafka('notifications', {
                        "user_id": emp.user.id,
                        "message": f"You have been assigned to project: '{project.project_name}' by {user_data.username}",
                        "type": "project",
                        "url": f"/projects/{project.id}/"
                    })
                        print(f"✅ Notification sent to {emp.company_email}")
                    else:
                        print(f"⚠️ Skipping {emp.company_email} — No linked User object.")
                

            serializer = ProjectSerializer(project)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            print("Error creating project:", e)
            return Response({"detail": "Internal Server Error", "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# function to update project
    def put(self, request, pk):
        user = request.user
        is_company = False
        is_employee = False

        try:
            user_data = User.objects.get(email=user.email)
            is_company = user_data.is_company
            is_employee = user_data.is_employee
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        company_id = None
        role_id = None
        # Determine user role and company
        if is_employee:
            try:
                employee_data = Employee.objects.get(company_email=user.email)
                role_id = employee_data.role_id
                company_id = employee_data.company_id
                if role_id not in [1, 2, 3]:
                    return Response({"detail": "Unauthorized role for this action."}, status=status.HTTP_403_FORBIDDEN)
            except Employee.DoesNotExist:
                return Response({"detail": "Employee data not found."}, status=status.HTTP_404_NOT_FOUND)
        elif is_company:
            company = Company.objects.get(email=user_data.email)
            company_id = company.id
        else:
            return Response({"detail": "Unauthorized user type."}, status=status.HTTP_403_FORBIDDEN)

        try:
            project = Project.objects.get(id=pk, company_id=company_id, active=True)
        except Project.DoesNotExist:
            return Response({"detail": "Project not found or you don't have permission to edit it."}, status=status.HTTP_404_NOT_FOUND)

        data_to_update = request.data.copy()

        # Role-based field filtering for role_id 3
        if is_employee and role_id == 3:
            allowed_fields = ['description', 'resolution_comments', 'endDate', 'status', 'phase']
            data_to_update = {k: v for k, v in data_to_update.items() if k in allowed_fields}

        # Key mapping from frontend to model fields
        key_map = {
            'projectName': 'project_name',
            'startDate': 'start_date',
            'endDate': 'end_date',
            'companyName': 'company_name',
            'clientName': 'client_name',
            'designAvailable': 'design_available',
        }

        for old_key, new_key in key_map.items():
            if old_key in data_to_update:
                value = data_to_update.pop(old_key)
                if isinstance(value, (list, tuple)) and len(value) == 1:
                    value = value[0]
                data_to_update[new_key] = value

        # Normalize boolean fields
        if 'design_available' in data_to_update:
            val = data_to_update['design_available']
            data_to_update['design_available'] = val.lower() == 'true' if isinstance(val, str) else bool(val)

        # Remove empty/null values
        for k in list(data_to_update.keys()):
            if data_to_update[k] in [None, '', 'null']:
                data_to_update.pop(k)

        # Transaction block for safe update
        with transaction.atomic():
            serializer = ProjectSerializer(project, data=data_to_update, partial=True)
            if serializer.is_valid():
                serializer.save()

                # File handling
                if 'srsFile' in request.FILES:
                    project.srs_file = request.FILES['srsFile']

                if 'wireframeFile' in request.FILES:
                    project.wireframe_file = request.FILES['wireframeFile']

                project.save()

                # Notification to company/admin if updated by employee
                if is_employee:
                    print('ankit mishra')
                    try:
                        # Notify the company user
                        company_user = Company.objects.get(id=company_id)
                        company_notify = User.objects.get(id=company_user.user_id)
                        # sending notification through kafka
                        send_to_kafka('notifications', {
                        "user_id": company_notify.id,
                        "message": f"Employee '{user_data.username}' made changes to the project '{project.project_name}'.",
                        "type": "project",
                        "url": f"/projects/{project.id}/"
                    })

                        # Notify all company admins (role_id=1)
                        admins = Employee.objects.filter(company_id=company_id, role_id=1)
                        for admin in admins:
                            if admin.company_email:
                                try:
                                    admin_user = User.objects.get(email=admin.company_email)

                                    send_to_kafka('notifications', {
                                        "user_id": admin_user.id,
                                        "message": f"Employee '{user_data.username}' made changes to the project '{project.project_name}'.",
                                        "type": "project",
                                        "url": f"/projects/{project.id}/"
                                    })
                                except User.DoesNotExist:
                                    print(f"⚠️ User not found for admin with email: {admin.company_email}")
                   
                    except User.DoesNotExist:
                        print("⚠️ Company user not found for notification.")
                    except Exception as e:
                        print(f"⚠️ Error sending notifications to admins: {e}")
                # AssignedTo handling
                if not (is_employee and role_id == 3):
                    assigned_to_raw = request.data.getlist('assignedTo') or request.data.getlist('assignedTo[]')
                    if assigned_to_raw:
                        assigned_to_ids = [int(i) for i in assigned_to_raw if i.isdigit()]
                        employees_to_assign = Employee.objects.filter(id__in=assigned_to_ids)
                        project.assigned_to.set(employees_to_assign)

                        for emp in employees_to_assign:
                            if emp.user:
                                send_to_kafka('notifications', {
                                    "user_id": emp.user.id,
                                    "message": f"Project '{project.project_name}' has been updated and you're assigned  by {user_data.username}",
                                    "type": "project",
                                    "url": f"/projects/{project.id}/"
                                })
                    else:
                        project.assigned_to.clear()

                return Response(ProjectSerializer(project).data, status=status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        user = request.user
        is_company = False
        is_employee = False

        try:
            user_data = User.objects.get(email=user.email)
            is_company = user_data.is_company
            is_employee = user_data.is_employee
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        company_id = None
        role_id = None

        # Identify company and role
        if is_company:
            try:
                company = Company.objects.get(email=user_data.email)
                company_id = company.id
            except Company.DoesNotExist:
                return Response({"detail": "Company not found."}, status=status.HTTP_404_NOT_FOUND)
        elif is_employee:
            try:
                employee = Employee.objects.get(company_email=user.email)
                company_id = employee.company_id
                role_id = employee.role_id
            except Employee.DoesNotExist:
                return Response({"detail": "Employee not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"detail": "Unauthorized user type."}, status=status.HTTP_403_FORBIDDEN)

        # Check permissions
        if not (is_company or (is_employee and role_id == 1)):
            return Response({"detail": "You do not have permission to delete this project."}, status=status.HTTP_403_FORBIDDEN)

        try:
            project = Project.objects.get(id=pk, company_id=company_id, active=True)
        except Project.DoesNotExist:
            return Response({"detail": "Project not found or already deleted."}, status=status.HTTP_404_NOT_FOUND)

        # Soft delete
        project.active = False
        project.save()

        # Notification message and URL
        notif_msg = f"Project '{project.project_name}' was deleted by '{user_data.username}'."
        notif_url = f"/projects/{project.id}/"

        try:
            # Notify company user
            company_user = Company.objects.get(id=company_id)
            company_notify = User.objects.get(id=company_user.user_id)

            send_to_kafka('notifications', {
                "user_id": company_notify.id,
                "message": notif_msg,
                "type": "project",
                "url": notif_url,
            })

            # Notify all company admins (role_id = 1)
            admins = Employee.objects.filter(company_id=company_id, role_id=1)
            for admin in admins:
                if admin.company_email:
                    try:
                        admin_user = User.objects.get(email=admin.company_email)
                        send_to_kafka('notifications', {
                            "user_id": admin_user.id,
                            "message": notif_msg,
                            "type": "project",
                            "url": notif_url,
                        })
                    except User.DoesNotExist:
                        print(f"⚠️ Admin user not found for {admin.company_email}")

            # Notify all assigned employees
            assigned_employees = project.assigned_to.all()
            for emp in assigned_employees:
                if emp.user:
                    send_to_kafka('notifications', {
                        "user_id": emp.user.id,
                        "message": notif_msg,
                        "type": "project",
                        "url": notif_url,
                    })

        except Exception as e:
            print(f"⚠️ Error sending notifications: {e}")

        return Response({"detail": "Project deleted successfully."}, status=status.HTTP_200_OK)

# For Bugs Report
class BugsReportsA(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk=None):
        user = request.user

        try:
            user_data = User.objects.get(email=user.email)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        company_id = None
        role_id = None
        employee_data = None

        # Determine user type and access scope
        if user_data.is_employee:
            try:
                employee_data = Employee.objects.get(company_email=user.email)
                role_id = employee_data.role_id
                company_id = employee_data.company_id
            except Employee.DoesNotExist:
                return Response({"detail": "Employee data not found"}, status=status.HTTP_404_NOT_FOUND)

        elif user_data.is_company:
            company_data = Company.objects.get(user_id=user_data.id)
            company_id = company_data.id
        else:
            return Response({"detail": "Unauthorized user type"}, status=status.HTTP_403_FORBIDDEN)

        # ✅ IF pk is provided: Return a single bug if accessible
        if pk is not None:
            try:
                bug = Bug.objects.select_related('project', 'company').get(id=pk, active=True)

                if user_data.is_employee:
                    if role_id == 3:
                        if bug.assigned_to.filter(id=employee_data.id).exists():
                            serializer = BugSerializer(bug)
                            return Response(serializer.data, status=status.HTTP_200_OK)
                        else:
                            return Response({"detail": "Access denied to this bug"}, status=status.HTTP_403_FORBIDDEN)

                    elif role_id == 1:
                        if bug.company_id == company_id:
                            serializer = BugSerializer(bug)
                            return Response(serializer.data, status=status.HTTP_200_OK)
                        else:
                            return Response({"detail": "Bug does not belong to your company"}, status=status.HTTP_403_FORBIDDEN)

                    else:
                        return Response({"detail": "Unauthorized role"}, status=status.HTTP_403_FORBIDDEN)

                elif user_data.is_company:
                    if bug.company_id == company_id:
                        serializer = BugSerializer(bug)
                        return Response(serializer.data, status=status.HTTP_200_OK)
                    else:
                        return Response({"detail": "Bug does not belong to your company"}, status=status.HTTP_403_FORBIDDEN)

            except Bug.DoesNotExist:
                return Response({"detail": "Bug not found"}, status=status.HTTP_404_NOT_FOUND)

        # ✅ ELSE: Return list of bugs
        if user_data.is_employee and role_id == 3:
            bugs = Bug.objects.filter(
                active=True,
                company__active=True,
                project__active=True,
            ).filter(
                Q(assigned_to=employee_data) | Q(created_by=user_data)
            ).select_related('project', 'company').order_by('-id')

            print('bugs ==<<>>', bugs)

        else:
            bugs = Bug.objects.filter(
                active=True,
                company_id=company_id
            ).select_related('project', 'company').order_by('-id')

        bugs_filtered = apply_common_filters(bugs, request)
        serializer = BugSerializer(bugs_filtered, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        user = request.user
        try:
            user_data = User.objects.get(email=user.email)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # Determine company ID
        if user_data.is_employee:
            try:
                employee_data = Employee.objects.get(company_email=user.email)
                # if employee_data.role_id != 1:
                #     return Response({"detail": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
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

        # Fix project
        data['project'] = int(data.get('project')) if data.get('project') else None

        # Fix assigned_to
        assigned_to = request.data.getlist('assigned_to') or request.data.get('assigned_to')
        if isinstance(assigned_to, str):
            assigned_to_ids = [int(assigned_to)]
        elif isinstance(assigned_to, list):
            assigned_to_ids = list(map(int, assigned_to))
        else:
            assigned_to_ids = []

        data.setlist('assigned_to', [str(i) for i in assigned_to_ids])  
        # Handle file upload
        if request.FILES.get('bug_attachment') and request.FILES['bug_attachment'].name != 'null':
            data['bug_attachment'] = request.FILES['bug_attachment']

        # Serialize and save
        data['active'] = True
        data['created_by'] = user_data.id
        
        serializer = BugSerializer(data=data)
        if serializer.is_valid():
            bug = serializer.save()

            # 🔔 Notify assigned employees
            employees = Employee.objects.filter(id__in=assigned_to_ids)
            for emp in employees:
                if emp.user:
                    # Notification.objects.create(
                    #     user=emp.user,
                    #     message=f"You have been assigned to bug: '{bug.title}' in project '{bug.project.project_name}'.",
                    #     notification_type="bug",
                    #     url=f"/bugs-reportes/{bug.id}/"
                    # )

                    send_to_kafka('notifications', {
                        "user_id": emp.user.id,
                        "message": f"You have been assigned to bug: '{bug.title}' in project '{bug.project.project_name}'. you're assigned  by {user_data.username}",
                        "type": "bug",
                        "url": f"/bugs-reportes/{bug.id}/" })
                    print(f"✅ Notification sent to {emp.company_email}")
                else:
                    print(f"⚠️ Skipping {emp.company_email} — No linked User object.")

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            print('Validation Errors:', serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    def put(self, request, pk):
        user = request.user

        # Get user data
        try:
            user_data = User.objects.get(email=user.email)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        company_id = None
        if user_data.is_employee:
            try:
                employee_data = Employee.objects.get(company_email=user.email)
                if employee_data.role_id not in [1, 3]:
                    return Response({"detail": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
                company_id = employee_data.company_id
            except Employee.DoesNotExist:
                return Response({"detail": "Employee data not found"}, status=status.HTTP_404_NOT_FOUND)
        elif user_data.is_company:
            company_data = Company.objects.get(user_id=user_data.id)
            company_id = company_data.id
        else:
            return Response({"detail": "Unauthorized user type"}, status=status.HTTP_403_FORBIDDEN)

        # Fetch the bug
        try:
            bug = Bug.objects.get(id=pk, company_id=company_id, active=True)
        except Bug.DoesNotExist:
            return Response({"detail": "Bug not found"}, status=status.HTTP_404_NOT_FOUND)

        # Prepare incoming data
        data = request.data.copy()
        data.pop('id', None)
        data['company'] = company_id

        if 'projectId' in data:
            data['project'] = data.pop('projectId')

        assigned_to_ids = request.data.getlist('assigned_to')
        data.setlist('assigned_to', assigned_to_ids)

        if request.FILES.get('bug_attachment') and request.FILES['bug_attachment'].name != 'null':
            data['bug_attachment'] = request.FILES['bug_attachment']

        data['updated_by'] = user_data.id

        serializer = BugSerializer(bug, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()

            # ✅ Notification message
            notif_msg = (
                f"🛠️ '{user_data.username}' updated the bug: "
                f"'{bug.title}' in project '{bug.project.project_name}'."
            )
            notif_url = f"/bugs-reportes/{bug.id}/"

            try:
                # Notify Company User
                company_user = Company.objects.get(id=company_id)
                user_details = User.objects.get(id=company_user.user_id)
                send_to_kafka('notifications', {
                    "user_id": user_details.id,
                    "message": notif_msg,
                    "type": "bug",
                    "url": notif_url,
                })

                # Notify Admins (role_id = 1)
                admins = Employee.objects.filter(company_id=company_id, role_id=1)
                for admin in admins:
                    if admin.company_email:
                        try:
                            admin_user = User.objects.get(email=admin.company_email)
                            send_to_kafka('notifications', {
                                "user_id": admin_user.id,
                                "message": notif_msg,
                                "type": "bug",
                                "url": notif_url,
                            })
                        except User.DoesNotExist:
                            print(f"⚠️ Admin user not found for {admin.company_email}")

                # Notify all assigned employees
                assigned_employees = Employee.objects.filter(id__in=assigned_to_ids)
                for emp in assigned_employees:
                    if emp.user:
                        send_to_kafka('notifications', {
                            "user_id": emp.user.id,
                            "message": notif_msg,
                            "type": "bug",
                            "url": notif_url,
                        })
                    else:
                        print(f"⚠️ Skipped {emp.company_email}: No linked User object.")

            except Exception as e:
                print(f"❌ Error sending notifications: {e}")

            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        user = request.user
        print('pk for delete bugs ==<<<>>', pk)
        # Get user data
        try:
            user_data = User.objects.get(email=user.email)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # Determine company ID
        company_id = None
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

        # Get the bug
        try:
            bug = Bug.objects.get(id=pk, company_id=company_id, active=True)
        except Bug.DoesNotExist:
            return Response({"detail": "Bug not found"}, status=status.HTTP_404_NOT_FOUND)

        # Soft delete
        bug.active = False
        bug.save()

        # ✅ Notification message
        notif_msg = (
            f" '{user_data.username}' deleted the bug: "
            f"'{bug.title}' from project '{bug.project.project_name}'."
        )
        notif_url = f"/bugs-reportes/{bug.id}/"

        print('notif_msg ==<<>>', notif_msg)

        try:
            # Notify Company User
            company_user = Company.objects.get(id=company_id)
            user_details = User.objects.get(id=company_user.user_id)
            send_to_kafka('notifications', {
                "user_id": user_details.id,
                "message": notif_msg,
                "type": "bug",
                "url": notif_url,
            })

            # Notify Admins (role_id = 1)
            admins = Employee.objects.filter(company_id=company_id, role_id=1)
            for admin in admins:
                if admin.company_email:
                    try:
                        admin_user = User.objects.get(email=admin.company_email)
                        send_to_kafka('notifications', {
                            "user_id": admin_user.id,
                            "message": notif_msg,
                            "type": "bug",
                            "url": notif_url,
                        })
                    except User.DoesNotExist:
                        print(f"⚠️ Admin user not found for {admin.company_email}")

            # Notify assigned employees
            assigned_employees = bug.assigned_to.all()
            for emp in assigned_employees:
                if emp.user:
                    send_to_kafka('notifications', {
                        "user_id": emp.user.id,
                        "message": notif_msg,
                        "type": "bug",
                        "url": notif_url,
                    })

        except Exception as e:
            print(f"❌ Notification error: {e}")

        return Response({"detail": "Bug marked as inactive"}, status=status.HTTP_204_NO_CONTENT)



