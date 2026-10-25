"""
Analytics domain models.

DailyMetric: aggregated per-billboard daily stats.
"""
import uuid

from django.db import models

from apps.billboards.models import Billboard


class DailyMetric(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    billboard = models.ForeignKey(
        Billboard, on_delete=models.CASCADE, related_name="daily_metrics"
    )
    date = models.DateField()

    # Exposure
    impressions = models.PositiveBigIntegerField(default=0)
    unique_views = models.PositiveBigIntegerField(default=0)

    # Demand
    bookings_count = models.PositiveIntegerField(default=0)
    booking_requests = models.PositiveIntegerField(default=0)  # Including pending

    # Revenue (from completed + paid bookings ending this day)
    revenue = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "daily_metrics"
        unique_together = [["billboard", "date"]]
        ordering = ["-date"]
        indexes = [
            models.Index(fields=["date"]),
            models.Index(fields=["billboard", "date"]),
        ]

    def __str__(self):
        return f"Metric {self.billboard_id} @ {self.date}"
