"""
User / Auth endpoints:
  POST /v1/auth/webhook        — Clerk user sync webhook
  GET  /v1/auth/me             — current user profile
  GET  /v1/users/              — list users (admin)
  PATCH /v1/users/:id/commission — update commission rate (super_admin)
  GET  /v1/audit-logs/         — audit log (admin)
"""
import hashlib
import hmac
import logging

from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsAdmin, IsSuperAdmin
from .models import AuditLog, BillboardOwner, User
from .serializers import (
    AuditLogSerializer,
    CommissionRateSerializer,
    UserCreateSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)


class ClerkWebhookView(APIView):
    """
    POST /v1/auth/webhook
    Clerk sends user.created / user.updated events here.
    Verified via Svix webhook signature.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Verify Clerk/Svix signature
        if not self._verify_signature(request):
            return Response({"errors": [{"code": "invalid_signature", "detail": "Bad webhook signature."}]}, status=400)

        payload = request.data
        event_type = payload.get("type")
        data = payload.get("data", {})

        if event_type in ("user.created", "user.updated"):
            self._sync_user(data)
        elif event_type == "user.deleted":
            clerk_id = data.get("id")
            User.objects.filter(clerk_id=clerk_id).update(is_active=False)

        return Response({"data": {"received": True}, "meta": {}, "errors": []})

    def _sync_user(self, data: dict):
        clerk_id = data.get("id")
        email = (data.get("email_addresses") or [{}])[0].get("email_address", "")
        first = data.get("first_name", "")
        last = data.get("last_name", "")
        full_name = f"{first} {last}".strip() or email
        phone = (data.get("phone_numbers") or [{}])[0].get("phone_number", "")

        User.objects.update_or_create(
            clerk_id=clerk_id,
            defaults={"email": email, "full_name": full_name, "phone": phone},
        )

    def _verify_signature(self, request) -> bool:
        secret = settings.CLERK_WEBHOOK_SECRET
        if not secret:
            return True  # Skip in dev if not configured
        signature = request.META.get("HTTP_SVIX_SIGNATURE", "")
        timestamp = request.META.get("HTTP_SVIX_TIMESTAMP", "")
        msg_id = request.META.get("HTTP_SVIX_ID", "")
        signed = f"{msg_id}.{timestamp}.{request.body.decode()}"
        expected = hmac.new(secret.encode(), signed.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(f"v1,{expected}", signature.split(" ")[0] if " " in signature else signature)


class MeView(generics.RetrieveAPIView):
    """GET /v1/auth/me"""
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    """GET /v1/users/ — admins only"""
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    queryset = User.objects.select_related("owner_profile").all()
    search_fields = ["email", "full_name", "clerk_id"]
    filterset_fields = ["role", "is_active"]


class CommissionRateView(APIView):
    """PATCH /v1/users/:id/commission — super_admin only"""
    permission_classes = [IsSuperAdmin]

    def patch(self, request, pk):
        owner = generics.get_object_or_404(BillboardOwner, user_id=pk)
        serializer = CommissionRateSerializer(owner, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        from apps.users.models import AuditLog
        AuditLog.objects.create(
            actor=request.user,
            action="commission.update",
            entity_type="billboard_owner",
            entity_id=owner.id,
            metadata={
                "new_rate": str(serializer.validated_data["commission_rate"]),
            },
        )
        return Response({"data": {"commission_rate": str(owner.commission_rate)}, "meta": {}, "errors": []})


class AuditLogListView(generics.ListAPIView):
    """GET /v1/audit-logs/ — admin only"""
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdmin]
    queryset = AuditLog.objects.select_related("actor").all()
    filterset_fields = ["action", "entity_type"]
