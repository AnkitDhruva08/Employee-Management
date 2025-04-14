from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from core.models import Employee
from core.serializers import EmployeeSerializer

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        company = self.request.user.company  
        serializer.save(company=company)
