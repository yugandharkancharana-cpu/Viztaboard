"""
Booking domain models.

Booking: a campaign reservation of a billboard for a date range.
"""
import uuid

from django.db import models

from apps.billboards.models import Billboard
from apps.users.models import User


class BookingStatus(models.TextChoices):
    PENDING = "pending", "Pending Review"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"
    CANCELLED = "cancelled", "Cancelled"
    COMPLETED = "completed", "Completed"


class PaymentStatus(models.TextChoices):
    UNPAID = "unpaid", "Unpaid"
    PROCESSING = "processing", "Processing"
    PAID = "paid", "Paid"
    REFUNDED = "refunded", "Refunded"
    FAILED = "failed", "Failed"


class Booking(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    billboard = models.ForeignKey(
        Billboard, on_delete=models.PROTECT, related_name="bookings"
    )
    advertiser = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="bookings"
    )

    # Campaign dates
    start_date = models.DateField()
    end_date = models.DateField()
    num_days = models.PositiveIntegerField(default=0)

    # Pricing (snapshot at booking time)
    price_per_day = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_price = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    # Workflow
    status = models.CharField(
        max_length=20, choices=BookingStatus.choices, default=BookingStatus.PENDING
    )
    payment_status = models.CharField(
        max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID
    )

    # Stripe
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, default="")
    stripe_client_secret = models.CharField(max_length=512, blank=True, default="")

    # Creative assets — list of S3 keys
    creative_assets = models.JSONField(default=list, blank=True)
    campaign_name = models.CharField(max_length=255, blank=True, default="")
    notes = models.TextField(blank=True, default="")

    # Review metadata
    rejection_reason = models.TextField(blank=True, default="")
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_bookings",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bookings"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["billboard", "status"]),
            models.Index(fields=["advertiser", "status"]),
            models.Index(fields=["start_date", "end_date"]),
        ]

    def __str__(self):
        return f"Booking {self.id} — {self.billboard.title} [{self.status}]"

    def save(self, *args, **kwargs):
        # Auto-compute num_days and total_price if dates are set
        if self.start_date and self.end_date:
            delta = (self.end_date - self.start_date).days
            self.num_days = max(delta, 0)
            if not self.price_per_day and self.billboard_id:
                try:
                    self.price_per_day = Billboard.objects.get(pk=self.billboard_id).base_price_per_day
                except Billboard.DoesNotExist:
                    pass
            self.total_price = self.price_per_day * self.num_days
        super().save(*args, **kwargs)
