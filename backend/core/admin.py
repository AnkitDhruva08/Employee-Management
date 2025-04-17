from django.contrib import admin

# Register your models here.
from .models import Company , Role, User, Employee, EmergencyContact, NomineeDetails, BankDetails, OfficeDetails, EmployeeDocument, Event, Holiday, LeaveRequest

admin.site.register(Company)
admin.site.register(Role)
admin.site.register(User)
admin.site.register(Employee)
admin.site.register(EmergencyContact)
admin.site.register(NomineeDetails)
admin.site.register(BankDetails)
admin.site.register(OfficeDetails)
admin.site.register(EmployeeDocument)
admin.site.register(Event)
admin.site.register(Holiday)
admin.site.register(LeaveRequest)
