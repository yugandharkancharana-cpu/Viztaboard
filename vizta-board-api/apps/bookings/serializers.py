from rest_framework import serializers

from apps.billboards.serializers import BillboardSerializer
from apps.users.serializers import UserSerializer

from .models import Booking, BookingStatus, PaymentStatus


class BookingSerializer(serializers.ModelSerializer):
    billboard = BillboardSerializer(read_only=True)
    advertiser = UserSerializer(read_only=True)
    reviewed_by = UserSerializer(read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "billboard", "advertiser",
            "start_date", "end_date", "num_days",
            "price_per_day", "total_price",
            "status", "payment_status",
            "stripe_payment_intent_id",
            "creative_assets", "campaign_name", "notes",
            "rejection_reason",
            "reviewed_at", "reviewed_by",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "num_days", "price_per_day", "total_price",
            "status", "payment_status", "stripe_payment_intent_id",
            "stripe_client_secret", "reviewed_at", "reviewed_by",
            "created_at", "updated_at",
        ]


class BookingCreateSerializer(serializers.ModelSerializer):
    billboard_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Booking
        fields = [
            "billboard_id", "start_date", "end_date",
            "creative_assets", "campaign_name", "notes",
        ]

    def validate(self, data):
        from apps.billboards.models import Billboard, BillboardStatus

        try:
            billboard = Billboard.objects.get(pk=data["billboard_id"], status=BillboardStatus.ACTIVE)
        except Billboard.DoesNotExist:
            raise serializers.ValidationError({"billboard_id": "Billboard not found or not active."})

        if data["start_date"] >= data["end_date"]:
            raise serializers.ValidationError({"end_date": "end_date must be after start_date."})

        # Conflict check
        from django.db.models import Q
        conflicts = Booking.objects.filter(
            billboard=billboard,
            status__in=[BookingStatus.PENDING, BookingStatus.APPROVED],
        ).filter(Q(start_date__lt=data["end_date"]) & Q(end_date__gt=data["start_date"]))
        if conflicts.exists():
            raise serializers.ValidationError("Billboard is not available for the requested dates.")

        data["billboard"] = billboard
        return data

    def create(self, validated_data):
        from .services import PricingEngine

        billboard = validated_data.pop("billboard")
        validated_data.pop("billboard_id", None)
        request = self.context["request"]

        pricing = PricingEngine(billboard).calculate(
            validated_data["start_date"], validated_data["end_date"]
        )

        booking = Booking.objects.create(
            billboard=billboard,
            advertiser=request.user,
            price_per_day=pricing["price_per_day"],
            total_price=pricing["total"],
            num_days=pricing["num_days"],
            **validated_data,
        )
        return booking


class BookingApproveSerializer(serializers.Serializer):
    """Used for the approve action."""
    pass


class BookingRejectSerializer(serializers.Serializer):
    rejection_reason = serializers.CharField(max_length=1000)


class PaymentIntentSerializer(serializers.Serializer):
    """Response shape when a Stripe PaymentIntent is created."""
    client_secret = serializers.CharField(read_only=True)
    payment_intent_id = serializers.CharField(read_only=True)
    amount = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    currency = serializers.CharField(read_only=True)
