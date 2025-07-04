from rest_framework import serializers
from .models import AttendanceSession, Company, Employee, Notification, Role, Event, Holiday, LeaveRequest, BankDetails,NomineeDetails,EmployeeDocument, EmergencyContact, OfficeDetails, CompanyDashboardLink, EmployeeDashboardLink, HrDashboardLink, AdminDashboardLink, Attendance, Project, Bug,Task, TaskSideBar, ProjectSideBar,TaskStatusTags
from django.contrib.auth import get_user_model
import json
from datetime import timedelta


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']


# class CompanySerializer(serializers.ModelSerializer):
#     user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)

#     class Meta:
#         model = Company
#         fields = ['id', 'company_name', 'email', 'team_size', 'address', 'contact_number', 'user']

class CompanySerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)

    class Meta:
        model = Company
        fields = [
            'id',
            'company_name',
            'email',
            'team_size',
            'street_address',
            'city',
            'state_province',
            'zip_code',
            'country',
            'contact_number',
            'user',
            'profile_image'
        ]


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
    insurance_number = serializers.CharField(required=False, allow_blank=True)
    epf_member = serializers.CharField(required=False, allow_blank=True)
    uan = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = EmployeeDocument
        fields = '__all__'

    def validate(self, attrs):
        request = self.context.get('request')

        # Validate mandatory aadhar and pan files only on create
        if self.instance is None:
            if not request.FILES.get('aadhar'):
                raise serializers.ValidationError({'aadhar': 'Aadhar document is required.'})
            if not request.FILES.get('pan'):
                raise serializers.ValidationError({'pan': 'PAN document is required.'})

        return attrs



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

# Admin Serializers

class AdminDashboardLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminDashboardLink
        fields = ['name', 'path', 'color', 'icons']




# Serializer for the Holidays model
class HolidaysSerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = '__all__'






# Serializer for the Attendance model
class AttendanceSessionSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    duration_hours = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceSession
        fields = '__all__'
        read_only_fields = ['user', 'company', 'is_active', 'duration']

    def get_duration_hours(self, obj):
        if obj.duration():
            total_seconds = obj.duration().total_seconds()
            hours = total_seconds / 3600
            return round(hours, 2)
        return None

# class AttendanceSerializer(serializers.ModelSerializer):
#     user_name = serializers.CharField(source='user.username', read_only=True)
#     company_name = serializers.CharField(source='company.name', read_only=True)
#     total_duration_hours = serializers.SerializerMethodField()

#     class Meta:
#         model = Attendance
#         fields = '__all__'
#         read_only_fields = ['user', 'company', 'total_duration']

#     def get_total_duration_hours(self, obj):
#         if obj.total_duration:
#             total_seconds = obj.total_duration.total_seconds()
#             hours = total_seconds / 3600
#             return round(hours, 2)
#         return None



class AttendanceSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='employee.user.username', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    total_duration_hours = serializers.SerializerMethodField()
    time_logs = serializers.JSONField()  # Read/write JSON logs

    class Meta:
        model = Attendance
        fields = '__all__'
        read_only_fields = ['employee', 'company', 'total_duration']

    def get_total_duration_hours(self, obj):
        if obj.total_duration:
            total_seconds = obj.total_duration.total_seconds()
            hours = total_seconds / 3600
            return round(hours, 2)
        return 0.0

    def to_representation(self, instance):
        """Ensure time_logs are parsed as JSON (if stored as string in fallback DBs)."""
        representation = super().to_representation(instance)
        if isinstance(instance.time_logs, str):
            try:
                representation['time_logs'] = json.loads(instance.time_logs)
            except json.JSONDecodeError:
                representation['time_logs'] = []
        return representation






# Project Serializers

class ProjectSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    updated_by = serializers.StringRelatedField(read_only=True)
    company = serializers.StringRelatedField(read_only=True)
    assigned_to = EmployeeSerializer(many=True, read_only=True)

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
            'company_name',
            'assigned_to',  
            'design_available',
            'srs_file',
            'wireframe_file',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        ]
    


class ProjectDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'project_name']


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
            'resolution_comments',
            'bug_attachment',
            'active',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        ]

    def get_assigned_to_name(self, obj):
        names = [f"{emp.first_name} {emp.last_name}" for emp in obj.assigned_to.all()]
        return ", ".join(names)
    




class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.project_name', read_only=True)
    # status = serializers.CharField(source='TaskStatusTags.name', read_only=True)
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



class TagStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskStatusTags
        fields = '__all__'