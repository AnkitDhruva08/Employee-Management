from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from core.models import Notification

class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
        data = [{
            "id": n.id,
            "message": n.message,
            "url": n.url,
            "is_read": n.is_read,
            "timestamp": n.timestamp
        } for n in notifications]
        print(f"🔔 Fetched {len(data)} notifications for user {request.user.email}")
        print("🔔 Notifications Data:", data)
        return Response(data)
