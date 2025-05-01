from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from core.models import HrDashboardLink
from core.serializers import HrDashboardLinkSerializer


class HrDashboardViewSet(viewsets.ModelViewSet):
    queryset = HrDashboardLink.objects.filter(active=True).order_by('id')
    serializer_class = HrDashboardLinkSerializer
    permission_classes = [IsAuthenticated]
