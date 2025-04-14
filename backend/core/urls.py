from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views.company_views import CompanyViewSet,InsertRoleView
from core.views.employee_views import EmployeeViewSet
from core.views.leave_views import LeaveRequestViewSet
from core.views.event_views import EventViewSet, HolidayViewSet
from core.views.auth_views import CompanyLoginView, CompanyRegisterView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
 

from core.views.dashboard_views import DashboardCompanyView,AdminDashboardView, EmployeeDashboardView

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
    path('company-login/', CompanyLoginView.as_view(), name='company-login'),
    path('register/', CompanyRegisterView.as_view(), name='company-register'),

    # insert Roles 
    path('roles/', InsertRoleView.as_view(), name='roles'),


    # dashboard 
    path('dashboard/company/',DashboardCompanyView.as_view(), name='company-dashboard'),
    path('dashboard/admin/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('dashboard/employee/', EmployeeDashboardView.as_view(), name='employee-dashboard'),

    # JWT token endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
