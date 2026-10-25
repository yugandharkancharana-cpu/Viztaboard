from rest_framework import serializers

from .models import DailyMetric


class DailyMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyMetric
        fields = [
            "id", "billboard", "date",
            "impressions", "unique_views",
            "bookings_count", "booking_requests", "revenue",
            "created_at", "updated_at",
        ]
        read_only_fields = fields


class AnalyticsOverviewSerializer(serializers.Serializer):
    """Read-only summary shape for GET /v1/analytics/overview."""
    total_billboards = serializers.IntegerField()
    active_billboards = serializers.IntegerField()
    total_bookings = serializers.IntegerField()
    pending_bookings = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=16, decimal_places=2)
    this_month_revenue = serializers.DecimalField(max_digits=16, decimal_places=2)


class BillboardAnalyticsSerializer(serializers.Serializer):
    """Per-billboard metrics summary."""
    billboard_id = serializers.UUIDField()
    billboard_title = serializers.CharField()
    period_start = serializers.DateField()
    period_end = serializers.DateField()
    total_impressions = serializers.IntegerField()
    total_bookings = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=14, decimal_places=2)
    daily_metrics = DailyMetricSerializer(many=True)
