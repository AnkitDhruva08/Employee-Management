from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from core.models import  Employee, EmployeeDashboardLink, HrDashboardLink, CompanyDashboardLink
from core.serializers import EmployeeDashboardLinkSerializer, HrDashboardLinkSerializer, CompanyDashboardLinkSerializer
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import F, Value, CharField
from django.db.models.functions import Concat
import traceback
from django.shortcuts import get_object_or_404


def dashboard_links(role_id, is_company):
    print('role_id ===<<<>>>>>>', role_id)
    print('is_company ===<<<>>>>>>', is_company)
    # Admin Dashboard
    if  is_company:
        try:
            dashboard_links = CompanyDashboardLink.objects.filter(active=True)
            serializer = CompanyDashboardLinkSerializer(dashboard_links, many=True)
            return Response( serializer.data, status=status.HTTP_200_OK)
        except Employee.DoesNotExist:
                    return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
    # HR Dashboard
    elif role_id == 2:
        try:
            dashboard_links = HrDashboardLink.objects.filter(active=True)
            serializer = HrDashboardLinkSerializer(dashboard_links, many=True)
            return Response( serializer.data, status=status.HTTP_200_OK)
        except Employee.DoesNotExist:
                    return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
    # Employee Dashboard
    elif role_id == 3:
        try:
            dashboard_links = EmployeeDashboardLink.objects.filter(active=True)
            serializer = EmployeeDashboardLinkSerializer(dashboard_links, many=True)
            return Response( serializer.data, status=status.HTTP_200_OK)
        except Employee.DoesNotExist:
                    return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

   

