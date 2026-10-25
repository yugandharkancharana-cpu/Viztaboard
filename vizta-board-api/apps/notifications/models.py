"""
Notification domain models.

Notification: a single message dispatched to a user.
PushToken:    device push token for Expo / FCM.
NotificationPreference: per-user channel opt-in settings.
"""
import uuid

from django.db import models

from apps.users.models import User


class NotificationType(models.TextChoices):
    BOOKING_SUBMITTED = "booking.submitted", "Booking Submitted"
    BOOKING_APPROVED = "booking.approved", "Booking Approved"
    BOOKING_REJECTED = "booking.rejected", "Booking Rejected"
    BOOKING_CANCELLED = "booking.cancelled", "Booking Cancelled"
    PAYMENT_RECEIVED = "payment.received", "Payment Received"
    SETTLEMENT_PROCESSED = "settlement.processed", "Settlement Processed"
    SYSTEM_ALERT = "system.alert", "System Alert"


class NotificationChannel(models.TextChoices):
    EMAIL = "email", "Email"
    PUSH = "push", "Push Notification"
    SMS = "sms", "SMS"


class NotificationStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    SENT = "sent", "Sent"
    FAILED = "failed", "Failed"


class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    notification_type = models.CharField(max_length=64, choices=NotificationType.choices)
    channel = models.CharField(max_length=20, choices=NotificationChannel.choices)
    title = models.CharField(max_length=255)
    body = models.TextField()
    data = models.JSONField(default=dict, blank=True)  # Extra payload for mobile
    status = models.CharField(
        max_length=20, choices=NotificationStatus.choices, default=NotificationStatus.PENDING
    )
    is_read = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read"]),
            models.Index(fields=["user", "notification_type"]),
        ]

    def __str__(self):
        return f"{self.notification_type} → {self.user.email} [{self.status}]"


class PushToken(models.Model):
    class Platform(models.TextChoices):
        IOS = "ios", "iOS"
        ANDROID = "android", "Android"
        WEB = "web", "Web"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="push_tokens")
    token = models.CharField(max_length=512)
    platform = models.CharField(max_length=20, choices=Platform.choices, default=Platform.IOS)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "push_tokens"
        unique_together = [["user", "token"]]

    def __str__(self):
        return f"{self.platform} token for {self.user.email}"


class NotificationPreference(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="notification_preferences"
    )
    email_enabled = models.BooleanField(default=True)
    push_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=False)

    class Meta:
        db_table = "notification_preferences"

    def __str__(self):
        return f"Preferences for {self.user.email}"
