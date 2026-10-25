"""
Celery tasks for delivering notifications.

send_email_notification  — AWS SES via boto3
send_push_notification   — Expo Push API
send_booking_notification — convenience: fan-out to all enabled channels
"""
import logging
from datetime import datetime, timezone

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_email_notification(self, notification_id: str):
    """Send a single Notification record via SES email."""
    from apps.notifications.models import Notification, NotificationStatus

    try:
        notif = Notification.objects.select_related("user").get(pk=notification_id)
    except Notification.DoesNotExist:
        logger.warning("Notification %s not found", notification_id)
        return

    try:
        import boto3
        from django.conf import settings

        client = boto3.client("ses", region_name=settings.AWS_SES_REGION)
        client.send_email(
            Source=settings.AWS_SES_FROM_EMAIL,
            Destination={"ToAddresses": [notif.user.email]},
            Message={
                "Subject": {"Data": notif.title, "Charset": "UTF-8"},
                "Body": {"Text": {"Data": notif.body, "Charset": "UTF-8"}},
            },
        )
        notif.status = NotificationStatus.SENT
        notif.sent_at = datetime.now(timezone.utc)
        notif.save(update_fields=["status", "sent_at"])
        logger.info("Email sent for notification %s", notification_id)

    except Exception as exc:
        logger.error("SES send failed for %s: %s", notification_id, exc)
        notif.status = NotificationStatus.FAILED
        notif.error_message = str(exc)
        notif.save(update_fields=["status", "error_message"])
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_push_notification(self, notification_id: str):
    """Send a push notification via Expo Push API."""
    from apps.notifications.models import Notification, NotificationStatus

    try:
        notif = Notification.objects.select_related("user").get(pk=notification_id)
    except Notification.DoesNotExist:
        return

    tokens = list(
        notif.user.push_tokens.filter(is_active=True).values_list("token", flat=True)
    )
    if not tokens:
        notif.status = NotificationStatus.SENT
        notif.save(update_fields=["status"])
        return

    try:
        import requests
        from django.conf import settings

        messages = [
            {
                "to": token,
                "title": notif.title,
                "body": notif.body,
                "data": notif.data,
                "sound": "default",
            }
            for token in tokens
        ]
        resp = requests.post(
            settings.EXPO_PUSH_URL,
            json=messages,
            headers={"Content-Type": "application/json"},
            timeout=10,
        )
        resp.raise_for_status()
        notif.status = NotificationStatus.SENT
        notif.sent_at = datetime.now(timezone.utc)
        notif.save(update_fields=["status", "sent_at"])

    except Exception as exc:
        logger.error("Expo push failed for %s: %s", notification_id, exc)
        notif.status = NotificationStatus.FAILED
        notif.error_message = str(exc)
        notif.save(update_fields=["status", "error_message"])
        raise self.retry(exc=exc)


@shared_task
def send_booking_notification(booking_id: str, event: str):
    """
    Fan-out notification for a booking event to all enabled channels.

    event: "approved" | "rejected" | "cancelled" | "payment_received"
    """
    from apps.bookings.models import Booking
    from apps.notifications.models import (
        Notification,
        NotificationChannel,
        NotificationType,
    )

    _EVENT_MAP = {
        "approved": (NotificationType.BOOKING_APPROVED, "Booking Approved", "Your booking has been approved!"),
        "rejected": (NotificationType.BOOKING_REJECTED, "Booking Rejected", "Your booking was rejected."),
        "cancelled": (NotificationType.BOOKING_CANCELLED, "Booking Cancelled", "Your booking has been cancelled."),
        "payment_received": (NotificationType.PAYMENT_RECEIVED, "Payment Confirmed", "Your payment has been received."),
    }

    if event not in _EVENT_MAP:
        logger.warning("Unknown booking event: %s", event)
        return

    try:
        booking = Booking.objects.select_related(
            "advertiser__notification_preferences"
        ).get(pk=booking_id)
    except Booking.DoesNotExist:
        return

    notif_type, title, body = _EVENT_MAP[event]
    user = booking.advertiser
    prefs = getattr(user, "notification_preferences", None)

    data = {
        "booking_id": str(booking.id),
        "billboard_title": booking.billboard.title,
        "event": event,
    }

    created_ids = []

    if prefs is None or prefs.email_enabled:
        n = Notification.objects.create(
            user=user,
            notification_type=notif_type,
            channel=NotificationChannel.EMAIL,
            title=title,
            body=body,
            data=data,
        )
        created_ids.append(str(n.id))
        send_email_notification.delay(str(n.id))

    if prefs and prefs.push_enabled:
        n = Notification.objects.create(
            user=user,
            notification_type=notif_type,
            channel=NotificationChannel.PUSH,
            title=title,
            body=body,
            data=data,
        )
        created_ids.append(str(n.id))
        send_push_notification.delay(str(n.id))

    return {"notification_ids": created_ids}
