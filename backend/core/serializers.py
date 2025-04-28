from rest_framework import serializers
from .models import Company, Employee, Role, Event, Holiday, LeaveRequest, BankDetails,NomineeDetails,EmployeeDocument, EmergencyContact, OfficeDetails, CompanyDashboardLink, EmployeeDashboardLink
from django.contrib.auth import get_user_model

User = get_user_model()

class CompanySerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)

    class Meta:
        model = Company
        fields = ['id', 'company_name', 'email', 'team_size', 'address', 'user']


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = '__all__'

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



