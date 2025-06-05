from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from core.models import Company, Employee, Holiday
from core.serializers import HolidaysSerializer
from django.contrib.auth import get_user_model 

# User Model
User = get_user_model()

class HolidaysViewset(APIView):
    permission_classes = [IsAuthenticated]

    # Retrive all holidays
    def get(self, request, *args, **kwargs):
        email = request.user.email
        is_company = Company.objects.filter(email=email).exists()
        role_id = None
        emp_id = None
        company_id = None
        if not is_company:
            try:
                employee = Employee.objects.get(company_email=email)
                role_id = employee.role_id
                emp_id = employee.id
                company_id = employee.company_id
            except Employee.DoesNotExist:
                return Response({'error': 'Employee not found'}, status=404)
                
        if(is_company):
            company_data = Company.objects.get(email = request.user.email)
            company_id = company_data.id
        holidays = Holiday.objects.filter(active=True, company_id=company_id).order_by("date")
        serializer = HolidaysSerializer(holidays, many=True)
        return Response({"count": len(holidays), "results": serializer.data})

    # insert new holidays only company can add holidays
    def post(self, request, *args, **kwargs):
        email = request.user.email
        company = Company.objects.filter(email=email).first()
        is_company = User.objects.filter(email=email).values('is_company').first()
        # Make a mutable copy of request data to inject fields
        if not is_company['is_company']:
            return Response({"error": "Only company can add holidays"}, status=status.HTTP_403_FORBIDDEN)
        data = request.data.copy()
        data["company"] = company.id if company else None
        data["created_by"] = request.user.id
        data["updated_by"] = request.user.id
        serializer = HolidaysSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        print('serializer errors ::::::::::', serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
