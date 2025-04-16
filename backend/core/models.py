from django.db import models
from django.contrib.auth.models import AbstractUser

# Custom user model to differentiate companies and employees
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


class Role(models.Model):
    role_name = models.CharField(max_length=100)  # e.g., HR, Admin, Engineer

    def __str__(self):
        return self.role_name


class Employee(models.Model):
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
    ]
    company = models.ForeignKey(User, on_delete=models.CASCADE, related_name='employees')   
    # Employee Details
    first_name = models.CharField("First Name", max_length=100)
    middle_name = models.CharField("Middle Name (Optional)", max_length=100, blank=True, null=True)
    last_name = models.CharField("Last Name (Surname)", max_length=100)

    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, verbose_name="Designation")

    contact_number = models.CharField("Contact Number", max_length=15)

    company_email = models.EmailField("Company's Email Address")
    personal_email = models.EmailField("Personal Email Address")

    date_of_birth = models.DateField("Date of Birth")
    gender = models.CharField("Gender", max_length=10, choices=GENDER_CHOICES)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class EmergencyContact(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='emergency_contacts')
    emergency_name = models.CharField(max_length=100)
    emergency_relation = models.CharField(max_length=50)
    emergency_contact = models.CharField(max_length=15)

    def __str__(self):
        return f"{self.emergency_name} ({self.emergency_relation})"


class NomineeDetails(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='nominee_details')
    nominee_name = models.CharField(max_length=100)
    nominee_dob = models.DateField()
    nominee_relation = models.CharField(max_length=50)
    nominee_contact = models.CharField(max_length=15)

    def __str__(self):
        return f"{self.nominee_name} ({self.nominee_relation})"


class BankDetails(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='bank_details')
    account_holder_name = models.CharField(max_length=100)
    bank_name = models.CharField(max_length=100)
    branch_name = models.CharField(max_length=100)
    ifsc = models.CharField(max_length=11)
    account_number = models.CharField(max_length=20)
    account_type = models.CharField(max_length=10, choices=[('saving', 'Saving'), ('salary', 'Salary')])
    bank_doc = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.account_holder_name} - {self.bank_name}"


class OfficeDetails(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='office_details')
    date_of_joining = models.DateField()
    probation_end = models.DateField()
    reporting_to = models.CharField(max_length=100)
    date_of_leaving = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.reporting_to} - {self.date_of_joining}"


class DocumentUploads(models.Model):
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='documents')

    # Base64 fields for frontend-uploaded docs/images
    photo = models.TextField(null=True, blank=True)
    aadhar = models.TextField(null=True, blank=True)
    pan = models.TextField(null=True, blank=True)
    dl = models.TextField(null=True, blank=True)
    appointment = models.TextField(null=True, blank=True)
    promotion = models.TextField(null=True, blank=True)
    resume = models.TextField(null=True, blank=True)
    esic_card = models.TextField(null=True, blank=True)

    # Additional employee info
    insurance_number = models.CharField(max_length=100)
    epf_member = models.CharField(max_length=3, choices=[('yes', 'Yes'), ('no', 'No')], default='no')
    uan = models.CharField(max_length=12)

    def __str__(self):
        return f"Documents of {self.employee.first_name} {self.employee.last_name}"


class Event(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    date = models.DateField()
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.title} ({self.date})"


class Holiday(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    date = models.DateField()

    def __str__(self):
        return f"{self.name} - {self.date}"


class LeaveRequest(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    from_date = models.DateField()
    to_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=[('Pending', 'Pending'), ('Approved', 'Approved'), ('Rejected', 'Rejected')],
        default='Pending'
    )

    def __str__(self):
        return f"{self.employee.first_name} leave from {self.from_date} to {self.to_date} ({self.status})"
