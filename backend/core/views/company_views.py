from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from core.models import Company
from core.serializers import CompanySerializer

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]



