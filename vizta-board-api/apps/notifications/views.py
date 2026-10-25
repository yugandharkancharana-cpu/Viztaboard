"""
Notification endpoints:
  GET  /v1/notifications/            — list user's notifications
  POST /v1/notifications/mark-all-read
  PATCH /v1/notifications/:id/read   — mark one as read
  GET  /v1/notifications/preferences
  PATCH /v1/notifications/preferences
  POST /v1/notifications/push-tokens — register device token
"""
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification, NotificationPreference, PushToken
from .serializers import (
    NotificationPreferenceSerializer,
    NotificationSerializer,
    PushTokenSerializer,
)


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["is_read", "notification_type", "channel"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class NotificationMarkReadView(APIView):
    """PATCH /v1/notifications/:id/read"""

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        notif = generics.get_object_or_404(Notification, pk=pk, user=request.user)
        notif.is_read = True
        notif.save(update_fields=["is_read"])
        return Response({"data": NotificationSerializer(notif).data, "meta": {}, "errors": []})


class NotificationMarkAllReadView(APIView):
    """POST /v1/notifications/mark-all-read"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response(
            {"data": {"marked_read": count}, "meta": {}, "errors": []},
            status=status.HTTP_200_OK,
        )


class NotificationPreferenceView(APIView):
    """GET / PATCH /v1/notifications/preferences"""

    permission_classes = [permissions.IsAuthenticated]

    def _get_or_create(self, user):
        prefs, _ = NotificationPreference.objects.get_or_create(user=user)
        return prefs

    def get(self, request):
        prefs = self._get_or_create(request.user)
        return Response(
            {"data": NotificationPreferenceSerializer(prefs).data, "meta": {}, "errors": []}
        )

    def patch(self, request):
        prefs = self._get_or_create(request.user)
        serializer = NotificationPreferenceSerializer(prefs, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"data": serializer.data, "meta": {}, "errors": []},
            status=status.HTTP_200_OK,
        )


class PushTokenView(APIView):
    """POST /v1/notifications/push-tokens"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PushTokenSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        token = serializer.save()
        return Response(
            {"data": PushTokenSerializer(token).data, "meta": {}, "errors": []},
            status=status.HTTP_201_CREATED,
        )
