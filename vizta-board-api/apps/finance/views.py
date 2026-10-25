"""
Finance endpoints:
  GET  /v1/finance/invoices/           — list (owner sees own; admin/finance sees all)
  GET  /v1/finance/invoices/:id/       — detail
  GET  /v1/finance/settlements/        — list
  POST /v1/finance/settlements/compute — trigger computation (admin / finance)
  POST /v1/finance/stripe/webhook      — Stripe webhook
"""
import hashlib
import hmac
import logging

from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsAdmin, IsFinanceTeam, IsBillboardOwner

from .models import Invoice, Settlement
from .serializers import InvoiceSerializer, SettlementComputeSerializer, SettlementSerializer

logger = logging.getLogger(__name__)


class InvoiceListView(generics.ListAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["status"]
    ordering_fields = ["created_at", "amount_gross"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        qs = Invoice.objects.select_related(
            "booking__billboard__owner__user", "booking__advertiser"
        )
        if user.is_admin or user.role == "finance":
            return qs.all()
        if user.role == "billboard_owner":
            owner = getattr(user, "owner_profile", None)
            return qs.filter(booking__billboard__owner=owner) if owner else qs.none()
        return qs.none()


class InvoiceDetailView(generics.RetrieveAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Invoice.objects.select_related(
            "booking__billboard__owner__user", "booking__advertiser"
        )
        if user.is_admin or user.role == "finance":
            return qs.all()
        if user.role == "billboard_owner":
            owner = getattr(user, "owner_profile", None)
            return qs.filter(booking__billboard__owner=owner) if owner else qs.none()
        return qs.none()


class SettlementListView(generics.ListAPIView):
    serializer_class = SettlementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["status"]
    ordering = ["-period_end"]

    def get_queryset(self):
        user = self.request.user
        qs = Settlement.objects.select_related("owner__user")
        if user.is_admin or user.role == "finance":
            return qs.all()
        if user.role == "billboard_owner":
            owner = getattr(user, "owner_profile", None)
            return qs.filter(owner=owner) if owner else qs.none()
        return qs.none()


class SettlementComputeView(APIView):
    """POST /v1/finance/settlements/compute — admin or finance."""

    permission_classes = [permissions.IsAuthenticated, IsAdmin | IsFinanceTeam]

    def post(self, request):
        serializer = SettlementComputeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        from .tasks import compute_settlements

        task = compute_settlements.delay(
            str(data["period_start"]),
            str(data["period_end"]),
            str(data["owner_id"]) if data.get("owner_id") else None,
        )

        return Response(
            {"data": {"task_id": task.id, "status": "queued"}, "meta": {}, "errors": []},
            status=status.HTTP_202_ACCEPTED,
        )


class StripeWebhookView(APIView):
    """POST /v1/finance/stripe/webhook"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        try:
            from .stripe_client import construct_webhook_event

            event = construct_webhook_event(payload, sig_header)
        except Exception as exc:
            logger.warning("Invalid Stripe webhook: %s", exc)
            return Response(
                {"errors": [{"code": "invalid_signature", "detail": str(exc)}]}, status=400
            )

        event_type = event.get("type")
        obj = event.get("data", {}).get("object", {})

        if event_type == "payment_intent.succeeded":
            self._handle_payment_succeeded(obj)
        elif event_type == "payment_intent.payment_failed":
            self._handle_payment_failed(obj)
        elif event_type == "payout.paid":
            self._handle_payout_paid(obj)

        return Response({"data": {"received": True}, "meta": {}, "errors": []})

    def _handle_payment_succeeded(self, intent: dict):
        from apps.bookings.models import Booking, BookingStatus, PaymentStatus
        from apps.finance.models import Invoice
        from core.utils import generate_invoice_number

        booking_id = intent.get("metadata", {}).get("booking_id")
        if not booking_id:
            return

        try:
            booking = Booking.objects.get(pk=booking_id)
            booking.payment_status = PaymentStatus.PAID
            if booking.status == BookingStatus.APPROVED:
                booking.status = BookingStatus.COMPLETED
            booking.save(update_fields=["payment_status", "status"])

            # Create invoice
            owner = booking.billboard.owner
            Invoice.objects.get_or_create(
                booking=booking,
                defaults={
                    "invoice_number": generate_invoice_number(str(owner.id)),
                    "amount_gross": booking.total_price,
                    "platform_fee_rate": owner.commission_rate,
                },
            )

            # Queue PDF generation
            from .tasks import generate_invoice_pdf

            try:
                inv = booking.invoice
                generate_invoice_pdf.delay(str(inv.id))
            except Exception:
                pass

            # Notify
            try:
                from apps.notifications.tasks import send_booking_notification

                send_booking_notification.delay(str(booking.id), "payment_received")
            except Exception:
                pass

        except Booking.DoesNotExist:
            logger.warning("Booking %s not found for payment_intent.succeeded", booking_id)

    def _handle_payment_failed(self, intent: dict):
        from apps.bookings.models import Booking, PaymentStatus

        booking_id = intent.get("metadata", {}).get("booking_id")
        if not booking_id:
            return
        try:
            Booking.objects.filter(pk=booking_id).update(payment_status=PaymentStatus.FAILED)
        except Exception:
            pass

    def _handle_payout_paid(self, payout: dict):
        from apps.finance.models import Settlement, SettlementStatus

        payout_id = payout.get("id")
        Settlement.objects.filter(stripe_payout_id=payout_id).update(
            status=SettlementStatus.COMPLETED
        )
