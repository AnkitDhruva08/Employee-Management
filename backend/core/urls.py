from django.conf import settings
from django.urls import path, include, re_path
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from core.views.role_views import RoleViews
from core.views.employee_views import EmployeeViewSet, EmployeeProfileViewSet, EmployeeFormViews, EmployeeBankDetailsView, NomineeDetailsView, EmployeeDocumentUploadView, EmployeeEmergencyContactView, EmployeeOfficeDetailsView, ProfileImageUploadView
from core.views.leave_views import LeaveRequestViewSet
from core.views.employee_report_views import EmployeePDFReportView
from core.views.event_views import EventViewSet
from core.views.auth_views import LoginLogoutView, CompanyRegisterView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
 
from core.views.attendence_views import AttendanceView
from core.views.dashboard_views import DashboardView, DashboardLinkViewSet
from core.views.project_views import ProjectManagement, BugsReportsA
from core.views.file_views import get_pdf
from core.views.holidays_views import HolidaysViewset

router = DefaultRouter()

# Registering all our ViewSets
router.register(r'events', EventViewSet)

# HR Dashboard

urlpatterns = [
    path('', include(router.urls)),

    # Custom endpoints
    path('login/', LoginLogoutView.as_view(), name='login'),
    path('logout/', LoginLogoutView.as_view(), name='logout'),


    #  Register Company 
    path('register/', CompanyRegisterView.as_view(), name='company-register'),


    # Employee Dashboard
    path('dashboard-link/', DashboardLinkViewSet.as_view(), name='dashboard-link'),
    # ADD Empolyees
    path('employees/', EmployeeViewSet.as_view(), name='employees'),
    path('employees/<int:pk>/', EmployeeViewSet.as_view(), name='employee'),
    # Employee Profile
    path('employee-profile/', EmployeeProfileViewSet.as_view(), name='employee-profile'),
    path('employee-profile/<int:pk>/', EmployeeProfileViewSet.as_view(), name='employee-profile'),

    #  Roles 
    path('roles/', RoleViews.as_view(), name='roles'),
    path('roles/<int:pk>/', RoleViews.as_view(), name='roles'),

    # Profile picture
    path('upload-profile-picture/', ProfileImageUploadView.as_view(), name='upload-profile-picture'),


    # dashboard 
    path('dashboard/',DashboardView.as_view(), name='dashboard'),
    # Employee Bank Details
    path('employee-bank-details/', EmployeeBankDetailsView.as_view(), name='employee-bank-details'),
    path('employee-bank-details/<int:pk>/', EmployeeBankDetailsView.as_view(), name='employee-bank-detail'),

    #  url for employee form views 
    
    path('Employee-Details-views/<int:pk>/', EmployeeFormViews.as_view(), name='Employee-Details-views'),


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

    # path for holyday calendar
    path('holidays/', HolidaysViewset.as_view(), name='holidays'),

    # Attendance History
    path('attendance/', AttendanceView.as_view(), name='attendance'),

    # Project management ProjectManagement 
    path('project-management/', ProjectManagement.as_view(), name='project-management'),
    path('create-project/', ProjectManagement.as_view(), name='create-project'),
    path('bugs-reportes/', BugsReportsA.as_view(), name='bugs-reportes'),


]

if settings.DEBUG is True:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)