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
        role_id = None
        emp_id = None
        company_id = None

        try:
            if Company.objects.filter(email=email).exists():
                # If user is a company
                company_data = Company.objects.get(email=email)
                company_id = company_data.id
            else:
                # If user is an employee
                employee = Employee.objects.get(company_email=email)
                role_id = employee.role_id
                emp_id = employee.id
                company_id = employee.company_id
        except Company.DoesNotExist:
            return Response({'error': 'Company not found'}, status=404)
        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=404)

        # Get holidays for the company
        holidays = Holiday.objects.filter(active=True, company_id=company_id).order_by("date")
        serializer = HolidaysSerializer(holidays, many=True)

        return Response({
            "count": len(holidays),
            "results": serializer.data
        }, status=200)

    # insert new holidays only company can add holidays
    def post(self, request, *args, **kwargs):
        email = request.user.email
        user = User.objects.get(email=email)

        is_company = user.is_company
        is_admin_user = user.is_employee
        admin_role_id = None
        company_id = None

        # Determine company_id based on user type
        if is_company:
            company = Company.objects.filter(email=email).first()
            if not company:
                return Response({'error': 'Company not found.'}, status=status.HTTP_404_NOT_FOUND)
            company_id = company.id

        elif is_admin_user:
            admin_data = Employee.objects.filter(company_email=email).first()
            if not admin_data:
                return Response({'error': 'Admin employee not found.'}, status=status.HTTP_404_NOT_FOUND)

            admin_role_id = admin_data.role_id
            company_id = admin_data.company_id

        #  Permission check: only company or admin with role_id == 1
        if not (is_company or admin_role_id == 1):
            return Response(
                {"error": "Only company or admin with role_id=1 can add holidays."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Prepare data for serializer
        data = request.data.copy()
        data["company"] = company_id
        data["created_by"] = request.user.id
        data["updated_by"] = request.user.id

        serializer = HolidaysSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        # Log validation errors
        print("Holiday serializer errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk=None, *args, **kwargs):
        email = request.user.email
        user = User.objects.get(email=email)

        is_company = user.is_company
        is_admin_user = user.is_employee
        admin_role_id = None
        company_id = None

        # Determine company_id based on user type
        if is_company:
            company = Company.objects.filter(email=email).first()
            if not company:
                return Response({'error': 'Company not found.'}, status=status.HTTP_404_NOT_FOUND)
            company_id = company.id

        elif is_admin_user:
            admin_data = Employee.objects.filter(company_email=email).first()
            if not admin_data:
                return Response({'error': 'Admin employee not found.'}, status=status.HTTP_404_NOT_FOUND)
            admin_role_id = admin_data.role_id
            company_id = admin_data.company_id

        #  Permission check: only company or admin with role_id == 1
        if not (is_company or admin_role_id == 1):
            return Response(
                {"error": "Only company or admin with role_id=1 can update holidays."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Retrieve the holiday object to update
        try:
            holiday = Holiday.objects.get(pk=pk, company_id=company_id)
        except Holiday.DoesNotExist:
            return Response({'error': 'Holiday not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Prepare data for updating
        data = request.data.copy()
        data["company"] = company_id
        data["updated_by"] = request.user.id

        # Update using the existing instance
        serializer = HolidaysSerializer(holiday, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Log validation errors
        print("Holiday serializer errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    