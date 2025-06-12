from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from core.models import TaskStatusTags, Company, Employee
from core.serializers import TagStatusSerializer
from django.contrib.auth import get_user_model

# User Modek
User = get_user_model()

class TagListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get_company_id(self, user):
        """Helper to get company_id from user (company or employee)."""
        if user.is_company:
            return Company.objects.get(email=user.email).id
        if user.is_employee:
            return Employee.objects.get(company_email=user.email).company_id
        return None

    def get(self, request):
        user = User.objects.get(email=request.user.email)
        company_id = self.get_company_id(user)

        tags = TaskStatusTags.objects.filter(company_id=company_id)
        serializer = TagStatusSerializer(tags, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        user = User.objects.get(email=request.user.email)
        company_id = self.get_company_id(user)

        tag_name = request.data.get('name')
        tag_data = TaskStatusTags.objects.filter(name=tag_name, company_id=company_id).first()
        
        if tag_data:
            return Response(
                {'message': 'Tag already exists for this company'},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = request.data.copy()
        data['company'] = company_id

        serializer = TagStatusSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response({'message' :serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        user = User.objects.get(email=request.user.email)
        company_id = self.get_company_id(user)

        try:
            tag = TaskStatusTags.objects.get(pk=pk, company_id=company_id)
        except TaskStatusTags.DoesNotExist:
            return Response({"error": "Tag not found for this company."}, status=status.HTTP_404_NOT_FOUND)

        tag.delete()
        return Response({"message": "Tag deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
