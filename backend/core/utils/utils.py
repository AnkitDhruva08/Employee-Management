
import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _
from django.core.validators import validate_email
from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
from rest_framework.response import Response
from rest_framework import status
from core.models import Employee, Company, EmployeeDashboardLink, Event, HrDashboardLink, CompanyDashboardLink, LeaveRequest, BankDetails, NomineeDetails, EmergencyContact, OfficeDetails
from core.serializers import EmployeeDashboardLinkSerializer, HrDashboardLinkSerializer, CompanyDashboardLinkSerializer, EmployeeSerializer, BankDetailsSerializer, NomineeDetailsSerializer, EmergencyContactSerializer, EmployeeOfficeDetailsSerializer
from datetime import date
from django.shortcuts import get_object_or_404


# User Model
User = get_user_model()
# Email validation function 
def validate_email_address(email):
    try:
        # Check if the email is valid
        validate_email(email)
    except ValidationError:
        raise ValidationError(_("Invalid email address"))

    # Check if the email domain is allowed
    allowed_domains = settings.ALLOWED_EMAIL_DOMAINS
    domain = email.split('@')[1]
    if domain not in allowed_domains:
        raise ValidationError(_("Email domain not allowed"))
    
    return True


#  function for check if employee have updated their profile or not
def is_profile_complete(employee_id):

    try:
        if not BankDetails.objects.filter(employee_id=employee_id, active=True).exists():
            return {
                "is_complete": False,
                "message": "Please complete your bank details to access full features.",
                "missing_sections": "Bank Details"
            }

        if not NomineeDetails.objects.filter(employee_id=employee_id, active=True).exists():
            return {
                "is_complete": False,
                "message": "Please complete your Nominee details to access full features.",
                "missing_sections": "Nominee Details"
            }

        if not EmergencyContact.objects.filter(employee_id=employee_id, active=True).exists():
            return {
                "is_complete": False,
                "message": "Please complete your Emergency Contact details to access full features.",
                "missing_sections": "Emergency Contact"
            }

        if not OfficeDetails.objects.filter(employee_id=employee_id, active=True).exists():
            return {
                "is_complete": False,
                "message": "Please complete your Office Details to access full features.",
                "missing_sections": "Office Details"
            }

        # ✅ If everything is complete
        return {
            "is_complete": True,
            "message": "Profile is complete. You can access all features.",
            "missing_sections": None
        }

    except Exception as e:
        print("Error checking profile:", e)
        return {
            "is_complete": False,
            "message": "An error occurred while checking profile completeness.",
            "error": str(e)
        }



# Function to check if the employee has completed their profile
def check_profile_completion(employee_id):
    try:
        employee = Employee.objects.get(id=employee_id)
        if employee.profile_complete:
            return True
        else:
            return False
    except Employee.DoesNotExist:
        return False
    except Exception as e:
        print("Error in check_profile_completion:", str(e))
        return False








def get_user_by_email(email):
    return User.objects.filter(email=email).first()

def get_company_by_email(email):
    return Company.objects.filter(email=email, active=True).first()

def get_employee_by_email(email):
    return Employee.objects.filter(company_email=email).first()

def get_role_name(role_id):
    from core.models import Role
    return Role.objects.get(id=role_id).role_name if role_id else None
