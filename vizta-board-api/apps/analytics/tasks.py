"""
Celery tasks for analytics aggregation.

aggregate_daily_metrics: scheduled nightly to compute daily stats per billboard.
"""
import logging
from datetime import date, timedelta

from celery import shared_task
from django.db import transaction
from django.db.models import Count, Sum

logger = logging.getLogger(__name__)


@shared_task
def aggregate_daily_metrics(target_date: str | None = None):
    """
    Aggregate booking-derived metrics for each billboard for `target_date`
    (defaults to yesterday).

    For production, this should be enriched with real impression data from
    an ad-serving or traffic counting source.
    """
    from apps.analytics.models import DailyMetric
    from apps.billboards.models import Billboard
    from apps.bookings.models import Booking, BookingStatus, PaymentStatus

    if target_date:
        day = date.fromisoformat(target_date)
    else:
        day = date.today() - timedelta(days=1)

    billboards = Billboard.objects.filter(status="active")
    updated = 0

    for billboard in billboards:
        try:
            with transaction.atomic():
                # Bookings active on this day
                active_bookings = Booking.objects.filter(
                    billboard=billboard,
                    start_date__lte=day,
                    end_date__gt=day,
                    status__in=[BookingStatus.APPROVED, BookingStatus.COMPLETED],
                )
                paid_bookings = active_bookings.filter(payment_status=PaymentStatus.PAID)

                agg = paid_bookings.aggregate(
                    total_revenue=Sum("total_price"),
                    booking_count=Count("id"),
                )
                revenue = agg["total_revenue"] or 0
                bookings_count = agg["booking_count"] or 0

                # All requests (including pending) on this day
                all_requests = Booking.objects.filter(
                    billboard=billboard,
                    start_date__lte=day,
                    end_date__gt=day,
                ).count()

                # Impressions: stub — multiply traffic_count by active booking count
                # In production integrate with your analytics SDK
                impressions = billboard.traffic_count * bookings_count

                DailyMetric.objects.update_or_create(
                    billboard=billboard,
                    date=day,
                    defaults={
                        "impressions": impressions,
                        "unique_views": int(impressions * 0.6),
                        "bookings_count": bookings_count,
                        "booking_requests": all_requests,
                        "revenue": revenue,
                    },
                )
                updated += 1

        except Exception as exc:
            logger.exception("Metric aggregation failed for billboard %s: %s", billboard.id, exc)

    logger.info("Daily metrics aggregated for %s: %d billboards", day, updated)
    return {"date": str(day), "billboards_updated": updated}
