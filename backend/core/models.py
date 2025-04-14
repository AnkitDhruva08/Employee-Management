from django.db import models
from django.contrib.auth.models import AbstractUser

# User model for authentication (companies & employees)
from django.contrib.auth import get_user_model

class User(AbstractUser):
    is_company = models.BooleanField(default=False)
    is_employee = models.BooleanField(default=False)

    def __str__(self):
        return self.username 

class Company(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="company")
    company_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    team_size = models.CharField(max_length=20)
    address = models.TextField()

    def __str__(self):
        return self.company_name

# Role model (HR, Admin, Engineer, etc.)
class Role(models.Model):
    role_name = models.CharField(max_length=100)  # e.g., HR, Admin, Engineer

    def __str__(self):
        return self.title

# Employee model
class Employee(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True)

    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100)
    present_address = models.TextField()
    permanent_address = models.TextField()
    contact_number = models.CharField(max_length=15)
    company_email = models.EmailField()
    personal_email = models.EmailField()
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=[('male', 'Male'), ('female', 'Female')])
    blood_group = models.CharField(max_length=5)
    marital_status = models.CharField(max_length=10)
    spouse_name = models.CharField(max_length=100, blank=True, null=True)

    emergency_name = models.CharField(max_length=100)
    emergency_relation = models.CharField(max_length=50)
    emergency_contact = models.CharField(max_length=15)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

# Event model (for internal company events)
class Event(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    date = models.DateField()
    description = models.TextField(blank=True)

# Holiday model (for company holidays)
class Holiday(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    date = models.DateField()

# Leave request model
class LeaveRequest(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    from_date = models.DateField()
    to_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=[('Pending', 'Pending'), ('Approved', 'Approved'), ('Rejected', 'Rejected')], default='Pending')
