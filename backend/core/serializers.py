from rest_framework import serializers
from .models import Company, Employee, Notification, Role, Event, Holiday, LeaveRequest, BankDetails,NomineeDetails,EmployeeDocument, EmergencyContact, OfficeDetails, CompanyDashboardLink, EmployeeDashboardLink, HrDashboardLink, Attendance, Project, Bug,Task, TaskSideBar, ProjectSideBar
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']


class CompanySerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)

    class Meta:
        model = Company
        fields = ['id', 'company_name', 'email', 'team_size', 'address', 'contact_number', 'user']


# class EmployeeSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Employee
#         fields = '__all__'


class EmployeeSerializer(serializers.ModelSerializer):
    role_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            'id', 'first_name', 'middle_name', 'last_name',
            'contact_number', 'company_email', 'personal_email',
            'date_of_birth', 'gender', 'profile_image', 'role_id', 'role_name'
        ]

    def get_role_name(self, obj):
        try:
            return Role.objects.get(id=obj.role_id).role_name
        except Role.DoesNotExist:
            return None
        

    def get_profile_image_url(self, obj):
        request = self.context.get('request')
        if obj.profile_image:
            return request.build_absolute_uri(obj.profile_image.url)
        return None

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'

class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = '__all__'

from bs4 import BeautifulSoup

class LeaveRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = '__all__'
    
    # Custom validation for reason to strip HTML (optional)
    def validate_reason(self, value):
        return BeautifulSoup(value, "html.parser").get_text()  # Strips HTML tags

    # Ensure the to_date is set correctly if the duration is 'Single day'
    def validate(self, data):
        if data.get('duration') == 'Single day' and data.get('to_date') != data.get('from_date'):
            raise serializers.ValidationError("For a single day leave, from_date and to_date must be the same.")
        return data




class BankDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankDetails
        fields = '__all__' 



class NomineeDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = NomineeDetails
        fields = '__all__'


class EmployeeDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeDocument
        fields = '__all__'



class EmergencyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyContact
        fields = '__all__'
            


class EmployeeOfficeDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfficeDetails
        fields = '__all__'





class CompanyDashboardLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyDashboardLink
        fields = ['name', 'path', 'color', 'icons']




class EmployeeDashboardLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeDashboardLink
        fields = ['name', 'path', 'color', 'icons']


# hr serializers

class HrDashboardLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = HrDashboardLink
        fields = ['name', 'path', 'color', 'icons']




# Serializer for the Holidays model
class HolidaysSerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = '__all__'






# Serializer for the Attendance model

class AttendanceSerializer(serializers.ModelSerializer):
    duration = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = ['date', 'login_time', 'logout_time', 'duration']

    def get_duration(self, obj):
        return str(obj.duration) if obj.duration else None






# Project Serializers

class ProjectSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    updated_by = serializers.StringRelatedField(read_only=True)
    company = serializers.StringRelatedField(read_only=True)
    # assigned_to = serializers.PrimaryKeyRelatedField(many=True, queryset=User.objects.all())
    get_assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id',
            'company',
            'project_name',
            'description',
            'start_date',
            'end_date',
            'status',
            'phase',    
            'client_name',
            'assigned_to',
            'design_available',
            'srs_file',
            'wireframe_file',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        ]

    def get_assigned_to_name(self, obj):
        names = [f"{emp.first_name} {emp.last_name}" for emp in obj.assigned_to.all()]
        return ", ".join(names)
    


# employeee # Serializers
class EmployeeProjectSerializer(serializers.Serializer):
    project_name = serializers.CharField()
    description = serializers.CharField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    progress = serializers.FloatField()
    status = serializers.CharField()
    team_leader = serializers.CharField(allow_blank=True, allow_null=True)


# Bugs Serializers
class BugSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.project_name', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = Bug
        fields = [
            'id',
            'title',
            'status',
            'priority',
            'created',
            'company',
            'project',
            'project_name',
            'assigned_to',
            'assigned_to_name',
            'description',
            'active'
        ]

    def get_assigned_to_name(self, obj):
        names = [f"{emp.first_name} {emp.last_name}" for emp in obj.assigned_to.all()]
        return ", ".join(names)
    




class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.project_name', read_only=True)
    team_lead_name = serializers.SerializerMethodField()
    member_names = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id',
            'company',
            'task_name',
            'status',
            'progress',
            'project',
            'project_name',
            'team_lead',
            'team_lead_name',
            'members',
            'member_names',
            'description',
            'created_at',
            'updated_at',
            'active',
        ]

    def get_team_lead_name(self, obj):
        if obj.team_lead:
            return f"{obj.team_lead.first_name} {obj.team_lead.last_name}"
        return None

    def get_member_names(self, obj):
        return ", ".join(f"{member.first_name} {member.last_name}" for member in obj.members.all())


class ProjectSidebarSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectSideBar
        fields = ['name', 'path', 'color', 'icons']



class TaskSidebarSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskSideBar
        fields = ['name', 'path', 'color', 'icons']





# notification serializers
class NotificationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'user', 'message', 'notification_type', 'url', 'created_at']
        read_only_fields = ['id', 'created_at']