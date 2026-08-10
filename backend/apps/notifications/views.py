from rest_framework import status, permissions, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema

from .models import Notification
from .serializers import NotificationSerializer

class NotificationListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        unread_count = queryset.filter(is_read=False).count()
        serializer = self.get_serializer(queryset[:30], many=True)
        return Response({
            "success": True,
            "unread_count": unread_count,
            "notifications": serializer.data
        }, status=status.HTTP_200_OK)

class NotificationMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        notification = get_object_or_404(Notification, pk=pk, user=request.user)
        notification.is_read = True
        notification.save()
        return Response({"success": True, "message": "Notification marked as read."}, status=status.HTTP_200_OK)

class NotificationMarkAllReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"success": True, "message": "All notifications marked as read."}, status=status.HTTP_200_OK)
