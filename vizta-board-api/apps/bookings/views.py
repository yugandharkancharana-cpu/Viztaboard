"""
Booking endpoints:
  GET  /v1/bookings/              — list (advertiser sees own; admin/ops sees all)
  POST /v1/bookings/              — create (advertiser)
  GET  /v1/bookings/:id/          — detail
  POST /v1/bookings/:id/approve   — approve (admin / ops)
  POST /v1/bookings/:id/reject    — reject (admin / ops)
  POST /v1/bookings/:id/cancel    — cancel (advertiser, own booking)
  POST /v1/bookings/:id/payment   — create Stripe PaymentIntent (advertiser)
"""
import logging
from datetime import datetime, timezone

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsAdmin, IsAdvertiser, IsOperations

from .models import Booking, BookingStatus, PaymentStatus
from .serializers import (
    BookingApproveSerializer,
    BookingCreateSerializer,
    BookingRejectSerializer,
    BookingSerializer,
    PaymentIntentSerializer,
)

logger = logging.getLogger(__name__)


class BookingListView(generics.ListCreateAPIView):
    """GET /v1/bookings/   POST /v1/bookings/"""

    def get_queryset(self):
        user = self.request.user
        qs = Booking.objects.select_related(
            "billboard__owner__user", "advertiser", "reviewed_by"
        )
        if user.is_admin or user.role in ("operations", "sales_exec"):
            return qs.all()
        if user.role == "billboard_owner":
            owner = getattr(user, "owner_profile", None)
            return qs.filter(billboard__owner=owner) if owner else qs.none()
        # Advertiser — own bookings only
        return qs.filter(advertiser=user)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return BookingCreateSerializer
        return BookingSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), IsAdvertiser()]
        return [permissions.IsAuthenticated()]

    filterset_fields = ["status", "payment_status"]
    search_fields = ["campaign_name", "billboard__title"]
    ordering_fields = ["created_at", "start_date", "total_price"]
    ordering = ["-created_at"]


class BookingDetailView(generics.RetrieveAPIView):
    """GET /v1/bookings/:id/"""

    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Booking.objects.select_related(
            "billboard__owner__user", "advertiser", "reviewed_by"
        )
        if user.is_admin or user.role in ("operations", "sales_exec"):
            return qs.all()
        if user.role == "billboard_owner":
            owner = getattr(user, "owner_profile", None)
            return qs.filter(billboard__owner=owner) if owner else qs.none()
        return qs.filter(advertiser=user)


class BookingApproveView(APIView):
    """POST /v1/bookings/:id/approve"""

    permission_classes = [permissions.IsAuthenticated, IsAdmin | IsOperations]

    def post(self, request, pk):
        booking = generics.get_object_or_404(Booking, pk=pk)
        if booking.status != BookingStatus.PENDING:
            return Response(
                {"errors": [{"code": "invalid_state", "detail": f"Cannot approve a booking with status '{booking.status}'."}]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        booking.status = BookingStatus.APPROVED
        booking.reviewed_at = datetime.now(timezone.utc)
        booking.reviewed_by = request.user
        booking.save(update_fields=["status", "reviewed_at", "reviewed_by"])

        # Notify advertiser
        try:
            from apps.notifications.tasks import send_booking_notification
            send_booking_notification.delay(str(booking.id), "approved")
        except Exception:
            pass

        return Response({"data": BookingSerializer(booking).data, "meta": {}, "errors": []})


class BookingRejectView(APIView):
    """POST /v1/bookings/:id/reject"""

    permission_classes = [permissions.IsAuthenticated, IsAdmin | IsOperations]

    def post(self, request, pk):
        booking = generics.get_object_or_404(Booking, pk=pk)
        if booking.status != BookingStatus.PENDING:
            return Response(
                {"errors": [{"code": "invalid_state", "detail": f"Cannot reject a booking with status '{booking.status}'."}]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = BookingRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        booking.status = BookingStatus.REJECTED
        booking.rejection_reason = serializer.validated_data["rejection_reason"]
        booking.reviewed_at = datetime.now(timezone.utc)
        booking.reviewed_by = request.user
        booking.save(update_fields=["status", "rejection_reason", "reviewed_at", "reviewed_by"])

        try:
            from apps.notifications.tasks import send_booking_notification
            send_booking_notification.delay(str(booking.id), "rejected")
        except Exception:
            pass

        return Response({"data": BookingSerializer(booking).data, "meta": {}, "errors": []})


class BookingCancelView(APIView):
    """POST /v1/bookings/:id/cancel — advertiser cancels own booking."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        booking = generics.get_object_or_404(Booking, pk=pk, advertiser=request.user)
        if booking.status not in (BookingStatus.PENDING, BookingStatus.APPROVED):
            return Response(
                {"errors": [{"code": "invalid_state", "detail": "Only pending or approved bookings can be cancelled."}]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        booking.status = BookingStatus.CANCELLED
        booking.save(update_fields=["status"])
        return Response({"data": BookingSerializer(booking).data, "meta": {}, "errors": []})


class BookingPaymentView(APIView):
    """POST /v1/bookings/:id/payment — create Stripe PaymentIntent."""

    permission_classes = [permissions.IsAuthenticated, IsAdvertiser]

    def post(self, request, pk):
        booking = generics.get_object_or_404(
            Booking, pk=pk, advertiser=request.user, status=BookingStatus.APPROVED
        )
        if booking.payment_status == PaymentStatus.PAID:
            return Response(
                {"errors": [{"code": "already_paid", "detail": "Booking is already paid."}]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            import stripe
            from django.conf import settings

            stripe.api_key = settings.STRIPE_SECRET_KEY
            amount_cents = int(booking.total_price * 100)

            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency="ngn",
                metadata={
                    "booking_id": str(booking.id),
                    "advertiser_id": str(booking.advertiser_id),
                },
                description=f"Vizta Board booking {booking.id}",
            )

            booking.stripe_payment_intent_id = intent["id"]
            booking.stripe_client_secret = intent["client_secret"]
            booking.payment_status = PaymentStatus.PROCESSING
            booking.save(update_fields=[
                "stripe_payment_intent_id", "stripe_client_secret", "payment_status"
            ])

            data = {
                "client_secret": intent["client_secret"],
                "payment_intent_id": intent["id"],
                "amount": booking.total_price,
                "currency": "NGN",
            }
            return Response({"data": data, "meta": {}, "errors": []})

        except Exception as exc:
            logger.exception("Stripe PaymentIntent creation failed: %s", exc)
            return Response(
                {"errors": [{"code": "payment_error", "detail": "Failed to create payment. Please try again."}]},
                status=status.HTTP_502_BAD_GATEWAY,
            )
