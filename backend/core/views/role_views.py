from core.models import Company, Role, Employee
from rest_framework.views import APIView
from rest_framework.response import Response
from core.serializers import RoleSerializer
from rest_framework import status

#  Role Views

class RoleViews(APIView):
    

    # retrive roles for dropdownlist and add new roles
    def get(self, request):
        try:
            email = request.user.email
            # is_company = Company.objects.filter(email=email).exists()
            # print('is_company for roles ', is_company)
            # company_id = None
            # if not is_company:
            #     try:
            #         employee = Employee.objects.get(company_email=email)
            #         company_id = employee.company_id
            #     except Employee.DoesNotExist:
            #         return Response({'error': 'Employee not found'}, status=404)
                
            # if(is_company):
            #     company_data = Company.objects.get(email = request.user.email)
            #     company_id = company_data.id
            # print('company_id ==<<>>', company_id)
            roles = Role.objects.filter(active=True).order_by('id')
            serializer = RoleSerializer(roles, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        role_name = request.data.get("role_name")
        if not role_name:
            return Response({"error": "Role name is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # is_company = Company.objects.filter(email=request.user.email).exists()
            # company_id = None
            # if not is_company:
            #     try:
            #         employee = Employee.objects.get(company_email=request.user.email)
            #         company_id = employee.company_id
            #     except Employee.DoesNotExist:
            #         return Response({'error': 'Employee not found'}, status=404)
                
            # if(is_company):
            #     company_data = Company.objects.get(email = request.user.email)
            #     company_id = company_data.id
            if Role.objects.filter(role_name=role_name, active=True).exists():
                return Response({"error": "This role already exists."}, status=status.HTTP_400_BAD_REQUEST)

            role = Role.objects.create(role_name=role_name)
            serializer = RoleSerializer(role)
            return Response({"message": "Role added successfully.", "data": serializer.data}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, pk=None):
        role_name = request.data.get("role_name")
        if not pk or not role_name:
            return Response({"error": "Role ID and name are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            role = Role.objects.filter(pk=pk, active=True).first()
            if not role:
                return Response({"error": "Role not found."}, status=status.HTTP_404_NOT_FOUND)

            # Check for duplicate name
            is_company = Company.objects.filter(email=request.user.email).exists()
            print('is_company ===<<<>>', is_company)
            company_id = None
            if not is_company:
                try:
                    employee = Employee.objects.get(company_email=request.user.email)
                    company_id = employee.company_id
                except Employee.DoesNotExist:
                    return Response({'error': 'Employee not found'}, status=404)
                
            if(is_company):
                company_data = Company.objects.get(email = request.user.email)
                company_id = company_data.id
            if Role.objects.filter(role_name=role_name, company_id=company_id, active=True).exclude(pk=pk).exists():
                return Response({"error": "Another role with this name already exists."}, status=status.HTTP_400_BAD_REQUEST)

            role.role_name = role_name
            role.save()
            serializer = RoleSerializer(role)
            return Response({"message": "Role updated successfully.", "data": serializer.data}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk=None):
        if not pk:
            return Response({"error": "Role ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            role = Role.objects.filter(pk=pk, active=True).first()
            if not role:
                return Response({"error": "Role not found."}, status=status.HTTP_404_NOT_FOUND)

            role.active = False
            role.save()
            return Response({"message": "Role deleted (soft delete) successfully."}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        
