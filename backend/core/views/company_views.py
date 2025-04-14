from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from core.models import Company, Role
from core.serializers import CompanySerializer
from rest_framework.views import APIView
from core.permissions import IsCompanyUser
from rest_framework.response import Response
from core.serializers import RoleSerializer
from rest_framework import status


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]



class InsertRoleView(APIView):
    def post(self, request):
        role_name = request.data.get("role_name")
        print('role_name ==<<>>', role_name)

        if not role_name:
            return Response({"error": "Role name is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:

            # Check for duplicate (case insensitive)
            if Role.objects.filter(role_name__iexact=role_name).exists():
                return Response({"error": "This role already exists."}, status=status.HTTP_400_BAD_REQUEST)

            role = Role.objects.create(role_name=role_name)
            serializer = RoleSerializer(role)
            return Response({"message": "Role added successfully.", "data": serializer.data}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)