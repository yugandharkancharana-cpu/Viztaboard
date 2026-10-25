from rest_framework import serializers

from apps.bookings.serializers import BookingSerializer
from apps.users.serializers import BillboardOwnerSerializer

from .models import Invoice, Settlement


class InvoiceSerializer(serializers.ModelSerializer):
    booking = BookingSerializer(read_only=True)

    class Meta:
        model = Invoice
        fields = [
            "id", "booking", "invoice_number",
            "amount_gross", "platform_fee_rate", "platform_fee", "amount_net",
            "status", "due_date", "paid_at", "stripe_payout_id", "pdf_s3_key",
            "created_at", "updated_at",
        ]
        read_only_fields = [f.name for f in Invoice._meta.fields]


class SettlementSerializer(serializers.ModelSerializer):
    owner = BillboardOwnerSerializer(read_only=True)

    class Meta:
        model = Settlement
        fields = [
            "id", "owner",
            "period_start", "period_end",
            "invoices_count", "gross_revenue", "platform_commission", "net_payout",
            "status", "stripe_payout_id",
            "initiated_at", "completed_at", "failure_reason",
            "created_at", "updated_at",
        ]
        read_only_fields = [f.name for f in Settlement._meta.fields]


class SettlementComputeSerializer(serializers.Serializer):
    """Request body for POST /v1/finance/settlements/compute"""
    period_start = serializers.DateField()
    period_end = serializers.DateField()
    owner_id = serializers.UUIDField(
        required=False, help_text="If omitted, computes for ALL owners."
    )

    def validate(self, data):
        if data["period_start"] >= data["period_end"]:
            raise serializers.ValidationError("period_end must be after period_start.")
        return data
