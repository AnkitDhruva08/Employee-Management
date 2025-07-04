from datetime import timedelta
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.utils.timezone import now
from django.core.validators import FileExtensionValidator
from django.contrib.postgres.fields import JSONField  

# Custom user model to differentiate companies and employees

class User(AbstractUser):
    is_company = models.BooleanField(default=False)
    is_employee = models.BooleanField(default=False)
    
    username = models.CharField(max_length=150) 
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username'] 

    def __str__(self):
        return self.username



def company_logo(instance, filename):
    # You can customize upload path here
    return f'company_logos/{instance.company_name}/{filename}'


class Company(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="company")
    company_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    team_size = models.CharField(max_length=20)

    # Split address fields instead of TextField for better form matching
    street_address = models.CharField(max_length=255, blank=True, null=True, default='')
    city = models.CharField(max_length=100, blank=True, null=True, default='')
    state_province = models.CharField(max_length=100, blank=True, null=True, default='Unknown')
    zip_code = models.CharField(max_length=10, blank=True, null=True, default='')
    country = models.CharField(max_length=100, blank=True, null=True, default='Unknown')

    contact_number = models.CharField(max_length=30, blank=True, null=True)
    active = models.BooleanField(default=True)
    profile_image = models.ImageField(upload_to=company_logo, null=True, blank=True)

    # Audit fields
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="company_created_by")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="company_updated_by")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.company_name

class Role(models.Model):
    # company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True)
    role_name = models.CharField(max_length=100)  
    active = models.BooleanField(default=True)  

    # Audit fields
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="role_created_by")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="role_updated_by")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.role_name

def user_profile_image_path(instance, filename):
    return f"profile_images/user_{instance.id}/{filename}"

class Employee(models.Model):
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
    ]
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='employees')
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='employee_profile')
    first_name = models.CharField("First Name", max_length=100)
    middle_name = models.CharField("Middle Name (Optional)", max_length=100, blank=True, null=True)
    last_name = models.CharField("Last Name (Surname)", max_length=100)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, verbose_name="Designation")
    contact_number = models.CharField("Contact Number", max_length=15)
    company_email = models.EmailField("Company's Email Address")
    personal_email = models.EmailField("Personal Email Address")
    date_of_birth = models.DateField("Date of Birth")
    gender = models.CharField("Gender", max_length=10, choices=GENDER_CHOICES)
    profile_image = models.ImageField(upload_to=user_profile_image_path, null=True, blank=True)
    active = models.BooleanField(default=True)  # New field

    # Audit fields
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="employee_created_by")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="employee_updated_by")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class EmergencyContact(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='emergency_contacts')
    emergency_name = models.CharField(max_length=100)
    emergency_relation = models.CharField(max_length=50)
    emergency_contact = models.CharField(max_length=15)
    active = models.BooleanField(default=True)  # New field

    # Audit fields
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="emergency_contact_created_by")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="emergency_contact_updated_by")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.emergency_name} ({self.emergency_relation})"


class NomineeDetails(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='nominee_details')
    nominee_name = models.CharField(max_length=100)
    nominee_dob = models.DateField()
    nominee_relation = models.CharField(max_length=50)
    nominee_contact = models.CharField(max_length=15)
    active = models.BooleanField(default=True)  # New field

    # Audit fields
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="nominee_created_by")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="nominee_updated_by")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.nominee_name} ({self.nominee_relation})"


class BankDetails(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='bank_details')
    account_holder_name = models.CharField(max_length=100)
    bank_name = models.CharField(max_length=100)
    branch_name = models.CharField(max_length=100)
    ifsc_code = models.CharField(max_length=11)
    account_number = models.CharField(max_length=20)
    account_type = models.CharField(max_length=10, choices=[('saving', 'Saving'), ('salary', 'Salary')])
    bank_details_pdf = models.FileField(upload_to='bank_pdfs/', null=True, blank=True)
    active = models.BooleanField(default=True)  # New field

    # Audit fields
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="bank_created_by")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="bank_updated_by")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.account_holder_name} - {self.bank_name}"


class OfficeDetails(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='office_details')
    date_of_joining = models.DateField()
    probation_end = models.DateField()
    reporting_to = models.CharField(max_length=100)
    active = models.BooleanField(default=True)  

    # Audit fields
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="office_created_by")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="office_updated_by")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.reporting_to} - {self.date_of_joining}"


class EmployeeDocument(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    insurance_number = models.CharField(max_length=50)
    epf_member = models.CharField(max_length=50)
    uan = models.CharField(max_length=50)
    
    photo = models.ImageField(upload_to='emp_documents/', blank=True, null=True)
    aadhar = models.FileField(upload_to='adhar_documents/', blank=True, null=True)
    pan = models.FileField(upload_to='pan_documents/', blank=True, null=True)
    dl = models.FileField(upload_to='dl_documents/', blank=True, null=True)
    appointment = models.FileField(upload_to='appointmen_documents/', blank=True, null=True)
    promotion = models.FileField(upload_to='promotion_documents/', blank=True, null=True)
    resume = models.FileField(upload_to='resume_documents/', blank=True, null=True)
    esic_card = models.FileField(upload_to='esic_documents/', blank=True, null=True)
    active = models.BooleanField(default=True)  # New field

    # Audit fields
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="document_created_by")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="document_updated_by")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)


class Event(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=255)
    date = models.DateField()
    description = models.TextField(blank=True)
    status = models.CharField(max_length=50)
    active = models.BooleanField(default=True)  # New field

    # Audit fields
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="event_created_by")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="event_updated_by")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.title} ({self.date})"


class Holiday(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='holiday')
    name = models.CharField(max_length=255)
    date = models.DateField()
    day_name = models.CharField(max_length=50)
    active = models.BooleanField(default=True)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="holiday_created_by")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="holiday_updated_by")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.date}"



class LeaveRequest(models.Model):

    LEAVE_TYPES = [
    ('CL', 'Casual Leave'),
    ('PL', 'Personal Leave'),
    ('SL', 'Sick Leave'),  # ✅ Add this
]
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True)
    leave_type = models.CharField(choices=LEAVE_TYPES, max_length=2)
    from_date = models.DateField()
    to_date = models.DateField(null=True, blank=True)
    reason = models.TextField()
    comment = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=[('Pending', 'Pending'), ('HR Approved', 'HR Approved'), ('HR Rejected', 'HR Rejected'), ('Admin Approved', 'Admin Approved'), ('Admin Rejected', 'Admin Rejected')], default='Pending')
    hr_reviewed = models.BooleanField(default=False)
    admin_reviewed = models.BooleanField(default=False)
    applied_at = models.DateTimeField(auto_now_add=True)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    leave_document = models.FileField(upload_to='leave_documents/',null=True,blank=True,validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png'])],
        help_text="Optional. Upload supporting document (PDF, JPG, PNG, JPEG)."
    )
    active = models.BooleanField(default=True) 

    # Audit fields
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="leave_created_by")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="leave_updated_by")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.employee.first_name} - {self.leave_type} ({self.status})"


class LeaveBalance(models.Model):
    employee = models.OneToOneField(User, on_delete=models.CASCADE)
    casual_leave = models.FloatField(default=0.0)
    personal_leave = models.FloatField(default=0.0)
    last_updated = models.DateField(null=True, blank=True)
    active = models.BooleanField(default=True)  # New field

    # Audit fields
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="leave_balance_created_by")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="leave_balance_updated_by")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    def __str__(self):
        return f"{self.employee.username} - CL: {self.casual_leave}, PL: {self.personal_leave}"






#  company dashboar link 
class CompanyDashboardLink(models.Model):
    name = models.CharField(max_length=255)
    path = models.CharField(max_length=255)
    color = models.CharField(max_length=50)
    icons = models.CharField(max_length=50, blank=True, null=True) 
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name
    



# Employee Dashboard link
class EmployeeDashboardLink(models.Model):
    name = models.CharField(max_length=255)
    path = models.CharField(max_length=255)
    color = models.CharField(max_length=50)
    icons = models.CharField(max_length=50, blank=True, null=True) 
    active = models.BooleanField(default=True) 

    def __str__(self):
        return self.name



# Hr dashboard link
class HrDashboardLink(models.Model):
    name = models.CharField(max_length=255)
    path = models.CharField(max_length=255)
    color = models.CharField(max_length=50)
    icons = models.CharField(max_length=50, blank=True, null=True)
    active = models.BooleanField(default=True) 
    def __str__(self):
        return self.name 
    

class AdminDashboardLink(models.Model):
    name = models.CharField(max_length=255)
    path = models.CharField(max_length=255)
    color = models.CharField(max_length=50)
    icons = models.CharField(max_length=50, blank=True, null=True)
    active = models.BooleanField(default=True) 
    def __str__(self):
        return self.name
    


# Attendance model
# class Attendance(models.Model):
#     user = models.ForeignKey(User, on_delete=models.CASCADE)
#     company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True)
#     date = models.DateField(default=now)
#     login_time = models.DateTimeField(null=True, blank=True)
#     logout_time = models.DateTimeField(null=True, blank=True)
#     active = models.BooleanField(default=True) 
#     status = models.CharField(max_length=20, choices=[('Present', 'Present'), ('Absent', 'Absent')], default='Present')
#     created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="attendance_created_by")
#     updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="attendance_updated_by")
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     @property
#     def duration(self):
#         if self.login_time and self.logout_time:
#             return self.logout_time - self.login_time
#         return None



class AttendanceSession(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    date = models.DateField(default=now)
    login_time = models.DateTimeField()
    logout_time = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True) 
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True) 

    def duration(self):
        if self.login_time and self.logout_time:
            return self.logout_time - self.login_time
        return None


# class Attendance(models.Model):
#     employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
#     company = models.ForeignKey(Company, on_delete=models.CASCADE)
#     date = models.DateField(default=now)
#     check_in = models.DateTimeField(null=True, blank=True)
#     check_out = models.DateTimeField(null=True, blank=True)
#     total_duration = models.DurationField(default=timedelta)
#     status = models.CharField(max_length=20, choices=[('Present', 'Present'), ('Absent', 'Absent')], default='Present')
#     active = models.BooleanField(default=True) 
#     created_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name="attendance_created_by")
#     updated_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name="attendance_updated_by")
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)



class Attendance(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    date = models.DateField(default=now)

    # JSON log for storing multiple check-in/out
    time_logs = models.JSONField(default=list) 

    total_duration = models.DurationField(default=timedelta)
    status = models.CharField(max_length=20, choices=[('Present', 'Present'), ('Absent', 'Absent')], default='Present')
    active = models.BooleanField(default=True)
    created_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name="attendance_created_by")
    updated_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name="attendance_updated_by")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def calculate_total_duration(self):
        total = timedelta()
        for entry in self.time_logs:
            try:
                check_in = models.DateTimeField().to_python(entry.get("check_in"))
                check_out = models.DateTimeField().to_python(entry.get("check_out"))
                if check_in and check_out:
                    total += (check_out - check_in)
            except Exception:
                continue
        return total

    def save(self, *args, **kwargs):
        self.total_duration = self.calculate_total_duration()
        super().save(*args, **kwargs)

    



# Project models 
class Project(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='projects')
    project_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=50)
    phase = models.CharField(max_length=100, blank=True, null=True)  
    company_name = models.CharField(max_length=255, blank=True)
    client_name = models.CharField(max_length=255, blank=True)
    assigned_to = models.ManyToManyField(Employee, related_name='projects')
    design_available = models.BooleanField(default=False)
    srs_file = models.FileField(upload_to='srs/', blank=True, null=True)
    wireframe_file = models.FileField(upload_to='wireframes/', blank=True, null=True)
    created_by = models.ForeignKey(User, related_name='created_projects', on_delete=models.SET_NULL, null=True)
    updated_by = models.ForeignKey(User, related_name='updated_projects', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    active = models.BooleanField(default=True)
    


# bugs models 
class Bug(models.Model):
    STATUS_CHOICES = [
        ("Open", "Open"),
        ("In Progress", "In Progress"),
        ("Blocked", "Blocked"),
        ("Done", "Done"),
    ]

    PRIORITY_CHOICES = [
        ("Low", "Low"),
        ("Medium", "Medium"),
        ("High", "High"),
        ("Critical", "Critical"),
    ]
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='bugs')
    title = models.CharField(max_length=255)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="bugs")
    description = models.TextField()
    resolution_comments = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Open")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="Medium")
    bug_attachment = models.FileField(upload_to='bugs-attachement/', blank=True, null=True)
    assigned_to = models.ManyToManyField(Employee, related_name="assigned_bugs")
    created = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="bugs_created")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="bugs_updated")
    active = models.BooleanField(default=True) 

    def __str__(self):
        return f"{self.title} ({self.status})"
        


# Project side Bar 
class ProjectSideBar(models.Model):
    name = models.CharField(max_length=255)
    path = models.CharField(max_length=255)
    color = models.CharField(max_length=50)
    icons = models.CharField(max_length=50, blank=True, null=True) 
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name
    

#  Task side bar
class TaskSideBar(models.Model):
    name = models.CharField(max_length=255)
    path = models.CharField(max_length=255)
    color = models.CharField(max_length=50)
    icons = models.CharField(max_length=50, blank=True, null=True) 
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name
    




# model for real time notification when project a, task or bugs created notify related employee

class Notification(models.Model):
    NOTIFICATION_TYPES = [
            ("project", "Project"),
            ("task", "Task"),
            ("bug", "Bug"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    url = models.URLField(blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
            return f"{self.user.username}: {self.message[:40]}"




# modal for task tag





class TaskStatusTags(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='task_tags')
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=100)  
    icon = models.TextField()
    active = models.BooleanField(default=True)
    

    def __str__(self):
        return self.name
    



# models for task management 
class Task(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='tasks')
    task_name = models.CharField(max_length=255)
    team_lead = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='led_tasks')
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    status =  models.ForeignKey(TaskStatusTags, on_delete=models.CASCADE, related_name='status')
    progress = models.PositiveIntegerField(default=0) 
    members = models.ManyToManyField(Employee, related_name='tasks')
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, related_name='created_tasks', null=True, blank=True, on_delete=models.SET_NULL)
    updated_by = models.ForeignKey(User, related_name='updated_tasks', null=True, blank=True, on_delete=models.SET_NULL)

    active = models.BooleanField(default=True) 

    def __str__(self):
        return self.task_name

