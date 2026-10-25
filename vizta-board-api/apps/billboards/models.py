"""
Billboard domain models.

Billboard: the physical/digital advertising unit.
BillboardAvailability: blocked-out date ranges (maintenance, booked).
"""
import uuid

from django.db import models

from apps.users.models import BillboardOwner


class MediaType(models.TextChoices):
    DIGITAL = "digital", "Digital"
    STATIC = "static", "Static"
    BOTH = "both", "Digital & Static"


class BillboardStatus(models.TextChoices):
    PENDING = "pending", "Pending Approval"
    ACTIVE = "active", "Active"
    INACTIVE = "inactive", "Inactive"
    MAINTENANCE = "maintenance", "Under Maintenance"


class Billboard(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        BillboardOwner, on_delete=models.CASCADE, related_name="billboards"
    )

    # Descriptive
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")

    # Location
    location_name = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    city = models.CharField(max_length=100, blank=True, default="")
    state = models.CharField(max_length=100, blank=True, default="")
    country = models.CharField(max_length=100, default="Nigeria")

    # Physical
    width_m = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    height_m = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    media_type = models.CharField(
        max_length=20, choices=MediaType.choices, default=MediaType.STATIC
    )
    illuminated = models.BooleanField(default=False)
    facing_direction = models.CharField(max_length=50, blank=True, default="")

    # Traffic & scoring
    traffic_count = models.PositiveIntegerField(
        default=0, help_text="Estimated daily vehicle/foot traffic"
    )
    visibility_score = models.PositiveSmallIntegerField(
        default=50, help_text="0–100 platform-calculated score"
    )

    # Commercial
    base_price_per_day = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(
        max_length=20, choices=BillboardStatus.choices, default=BillboardStatus.PENDING
    )
    is_featured = models.BooleanField(default=False)

    # Media: list of S3 keys / CloudFront URLs stored as JSON
    images = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "billboards"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "is_featured"]),
            models.Index(fields=["city", "state"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.location_name})"
