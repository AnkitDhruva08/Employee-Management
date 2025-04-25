from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from core.models import Company, CompanyDashboardLink
from core.serializers import CompanySerializer, CompanyDashboardLinkSerializer

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]



class CompanyDashboardViewSet(viewsets.ModelViewSet):
    queryset = CompanyDashboardLink.objects.all().order_by('id')
    serializer_class = CompanyDashboardLinkSerializer
    permission_classes = [IsAuthenticated]
