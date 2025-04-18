from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views.company_views import CompanyViewSet
from core.views.role_views import InsertRoleView, RoleDropdownView
from core.views.employee_views import EmployeeViewSet, EmployeeBankDetailsView, NomineeDetailsView, EmployeeDocumentUploadView, EmployeeEmergencyContactView, EmployeeOfficeDetailsView
from core.views.leave_views import LeaveRequestViewSet
from core.views.event_views import EventViewSet, HolidayViewSet
from core.views.auth_views import LoginView, CompanyRegisterView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
 

from core.views.dashboard_views import DashboardView

router = DefaultRouter()

# Registering all our ViewSets
router.register(r'companies', CompanyViewSet)
router.register(r'employees', EmployeeViewSet)
router.register(r'leaves', LeaveRequestViewSet)
router.register(r'events', EventViewSet)
router.register(r'holidays', HolidayViewSet)

urlpatterns = [
    path('', include(router.urls)),

    # Custom endpoints
    path('login/', LoginView.as_view(), name='login'),

    #  Register Company 
    path('register/', CompanyRegisterView.as_view(), name='company-register'),

    # insert Roles 
    path('roles/', InsertRoleView.as_view(), name='roles'),
    # role dropdownlist
    path('roles-dropdown/', RoleDropdownView.as_view(), name='roles-dropdown'),


    # dashboard 
    path('dashboard/',DashboardView.as_view(), name='dashboard'),
    # Employee Bank Details
    path('employee-bank-details/', EmployeeBankDetailsView.as_view(), name='employee-bank-details'),
    path('employee-bank-details/<int:pk>/', EmployeeBankDetailsView.as_view()),

    # Nominee Details
    path('employee-nominee-details/', NomineeDetailsView.as_view(), name='employee-nominee-details'),
    path('employee-nominee-details/<int:pk>/', NomineeDetailsView.as_view()),

    # Employee Document
    path('employee-documents/', EmployeeDocumentUploadView.as_view(), name='employee-documents'),
    path('employee-documents/<int:pk>/', EmployeeDocumentUploadView.as_view()),

    # Employee Emergency Contacts Details
    path('employee-emergency-details/', EmployeeEmergencyContactView.as_view(), name='employee-emergency-details'),
    path('employee-emergency-details/<int:pk>/', EmployeeEmergencyContactView.as_view()),

    # Employee Offices Details
    path('employee-office-details/', EmployeeOfficeDetailsView.as_view(), name='employee-office-details'),
    path('employee-office-details/<int:pk>/', EmployeeOfficeDetailsView.as_view()),



    # JWT token endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
