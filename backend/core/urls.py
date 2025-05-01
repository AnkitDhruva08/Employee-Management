from django.conf import settings
from django.urls import path, include, re_path
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from core.views.company_views import CompanyViewSet, CompanyDashboardViewSet
from core.views.role_views import InsertRoleView, RoleDropdownView
from core.views.employee_views import EmployeeViewSet, EmployeeBankDetailsView, NomineeDetailsView, EmployeeDocumentUploadView, EmployeeEmergencyContactView, EmployeeOfficeDetailsView, EmployeeDashboardViewSet
from core.views.leave_views import LeaveRequestViewSet
from core.views.employee_report_views import EmployeePDFReportView
from core.views.event_views import EventViewSet, HolidayViewSet
from core.views.auth_views import LoginView, CompanyRegisterView, current_user
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
 

from core.views.dashboard_views import DashboardView
from core.views.hr_views import HrDashboardViewSet
from core.views.file_views import get_pdf

router = DefaultRouter()

# Registering all our ViewSets
router.register(r'company-dashboard-link', CompanyDashboardViewSet)
router.register(r'companies', CompanyViewSet)
router.register(r'employees-dashboard-link', EmployeeDashboardViewSet)
# router.register(r'leaves', LeaveRequestViewSet)
router.register(r'events', EventViewSet)
router.register(r'holidays', HolidayViewSet)

# HR Dashboard
router.register(r'hr-dashboard-link', HrDashboardViewSet)

urlpatterns = [
    path('', include(router.urls)),

    # Custom endpoints
    path('login/', LoginView.as_view(), name='login'),
    # fetch current user details
   path('current-user/', current_user, name='current-user'),

    #  Register Company 
    path('register/', CompanyRegisterView.as_view(), name='company-register'),

    # ADD Empolyees
    path('employees/', EmployeeViewSet.as_view(), name='employees'),
    path('employees/<int:pk>/', EmployeeViewSet.as_view(), name='employee'),

    # insert Roles 
    path('roles/', InsertRoleView.as_view(), name='roles'),
    # role dropdownlist
    path('roles-dropdown/', RoleDropdownView.as_view(), name='roles-dropdown'),


    # dashboard 
    path('dashboard/',DashboardView.as_view(), name='dashboard'),
    # Employee Bank Details
    path('employee-bank-details/', EmployeeBankDetailsView.as_view(), name='employee-bank-details'),
    path('employee-bank-details/<int:pk>/', EmployeeBankDetailsView.as_view(), name='employee-bank-detail'),


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

    # employee Leave Requests
    path('leave-requests/', LeaveRequestViewSet.as_view(), name='leave-requests'),
    path('leave-requests/<int:pk>/', LeaveRequestViewSet.as_view(), name='leave-request-detail'),
    



    # JWT token endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('pdf/media/<str:filename>/', get_pdf, name='get_pdf'),
    re_path(r'^pdf/media/(?P<filename>.+)$', get_pdf, name='get_pdf'),


    #  for download employee details
    path('download-employee-report/', EmployeePDFReportView.as_view(), name='download-employee-report'),
]

if settings.DEBUG is True:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)