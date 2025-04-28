from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from core.models import HrDashboardLink
from core.serializers import HrDashboardLinkSerializer



class HrDashboardViewSet(viewsets.ModelViewSet):
    queryset = HrDashboardLink.objects.all().order_by('id')
    serializer_class = HrDashboardLinkSerializer
    permission_classes = [IsAuthenticated]
    # permission_classes = [IsHRorAdmin]
    # filter_backends = [filters.SearchFilter]
    # search_fields = ['employee__first_name', 'employee__last_name', 'employee__company_email']