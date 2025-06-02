from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from core.models import Notification  
from django.shortcuts import get_object_or_404

class NotificationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        print(f"🔔 NotificationView GET request by user: {request.user.email}")
        print(f"🔍 NotificationView parameters: pk={pk}")
        if pk:
            notification = get_object_or_404(Notification, pk=pk, user=request.user)
            data = {
                "id": notification.id,
                "message": notification.message,
                "url": notification.url,
                "is_read": notification.is_read,
                "timestamp": notification.created_at
            }
            print(f"🔔 Fetched notification ID {pk} for user {request.user.email}")
            return Response(data)
        else:
            notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
            data = [{
                "id": n.id,
                "message": n.message,
                "url": n.url,
                "is_read": n.is_read,
                "timestamp": n.created_at
            } for n in notifications]
            print(f"🔔 Fetched {len(data)} notifications for user {request.user.email}")
            return Response(data)
    def post(self, request, pk=None):
        if pk:
            notification = get_object_or_404(Notification, pk=pk, user=request.user)
            notification.is_read = True
            notification.save()
            return Response({"message": "Notification marked as read."}, status=status.HTTP_200_OK)
        return Response({"error": "Notification ID required."}, status=status.HTTP_400_BAD_REQUEST)
    





# views.py
class UnreadNotificationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user, is_read=False).order_by('-created_at')
        data = [{
            "id": n.id,
            "message": n.message,
            "url": n.url,
            "is_read": n.is_read,
            "timestamp": n.created_at
        } for n in notifications]
        return Response(data)
