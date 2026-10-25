"""
Finance domain models.

Invoice: per-booking billing document.
Settlement: periodic aggregation of owner earnings → payout.
"""
import uuid

from django.db import models

from apps.bookings.models import Booking
from apps.users.models import BillboardOwner


class InvoiceStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PAID = "paid", "Paid"
    OVERDUE = "overdue", "Overdue"
    CANCELLED = "cancelled", "Cancelled"


class SettlementStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PROCESSING = "processing", "Processing"
    COMPLETED = "completed", "Completed"
    FAILED = "failed", "Failed"


class Invoice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField(
        Booking, on_delete=models.PROTECT, related_name="invoice"
    )
    invoice_number = models.CharField(max_length=64, unique=True)

    # Amounts
    amount_gross = models.DecimalField(max_digits=14, decimal_places=2)
    platform_fee_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=15.00,
        help_text="Platform commission % applied at invoice time"
    )
    platform_fee = models.DecimalField(max_digits=14, decimal_places=2)
    amount_net = models.DecimalField(max_digits=14, decimal_places=2)

    status = models.CharField(
        max_length=20, choices=InvoiceStatus.choices, default=InvoiceStatus.PENDING
    )
    due_date = models.DateField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    stripe_payout_id = models.CharField(max_length=255, blank=True, default="")

    # PDF stored in S3
    pdf_s3_key = models.CharField(max_length=512, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "invoices"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.invoice_number} [{self.status}]"

    def save(self, *args, **kwargs):
        if not self.platform_fee and self.amount_gross:
            import decimal
            rate = self.platform_fee_rate / decimal.Decimal("100")
            self.platform_fee = (self.amount_gross * rate).quantize(decimal.Decimal("0.01"))
            self.amount_net = (self.amount_gross - self.platform_fee).quantize(decimal.Decimal("0.01"))
        super().save(*args, **kwargs)


class Settlement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        BillboardOwner, on_delete=models.PROTECT, related_name="settlements"
    )
    period_start = models.DateField()
    period_end = models.DateField()

    invoices_count = models.PositiveIntegerField(default=0)
    gross_revenue = models.DecimalField(max_digits=16, decimal_places=2, default=0)
    platform_commission = models.DecimalField(max_digits=16, decimal_places=2, default=0)
    net_payout = models.DecimalField(max_digits=16, decimal_places=2, default=0)

    status = models.CharField(
        max_length=20, choices=SettlementStatus.choices, default=SettlementStatus.PENDING
    )
    stripe_payout_id = models.CharField(max_length=255, blank=True, default="")
    initiated_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    failure_reason = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "settlements"
        ordering = ["-period_end"]
        unique_together = [["owner", "period_start", "period_end"]]

    def __str__(self):
        return f"Settlement {self.owner} {self.period_start}→{self.period_end} [{self.status}]"
