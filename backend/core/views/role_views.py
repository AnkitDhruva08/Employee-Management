from core.models import Company, Role
from rest_framework.views import APIView
from rest_framework.response import Response
from core.serializers import RoleSerializer
from rest_framework import status

#  Role Views

class RoleViews(APIView):

    # retrive roles for dropdownlist and add new roles
    def get(self, request):
        try:
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
            if Role.objects.filter(role_name__iexact=role_name, active=True).exists():
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
            if Role.objects.filter(role_name__iexact=role_name, active=True).exclude(pk=pk).exists():
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

        
