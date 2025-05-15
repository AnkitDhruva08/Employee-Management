from rest_framework import serializers
from .models import Company, Employee, Role, Event, Holiday, LeaveRequest, BankDetails,NomineeDetails,EmployeeDocument, EmergencyContact, OfficeDetails, CompanyDashboardLink, EmployeeDashboardLink, HrDashboardLink, Attendance
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
