"""
Analytics endpoints:
  GET /v1/analytics/overview        — platform-wide summary (admin / finance)
  GET /v1/analytics/billboards/:id  — per-billboard metrics (owner / admin)
"""
import logging
from datetime import date, timedelta

from django.db.models import Count, Sum
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsAdmin, IsBillboardOwner, IsFinanceTeam

from .models import DailyMetric
from .serializers import BillboardAnalyticsSerializer, DailyMetricSerializer

logger = logging.getLogger(__name__)


class AnalyticsOverviewView(APIView):
    """GET /v1/analytics/overview — admin or finance only."""

    permission_classes = [permissions.IsAuthenticated, IsAdmin | IsFinanceTeam]

    def get(self, request):
        from apps.billboards.models import Billboard, BillboardStatus
        from apps.bookings.models import Booking, BookingStatus, PaymentStatus

        today = date.today()
        month_start = today.replace(day=1)

        total_billboards = Billboard.objects.count()
        active_billboards = Billboard.objects.filter(status=BillboardStatus.ACTIVE).count()
        total_bookings = Booking.objects.count()
        pending_bookings = Booking.objects.filter(status=BookingStatus.PENDING).count()

        revenue_agg = Booking.objects.filter(
            payment_status=PaymentStatus.PAID
        ).aggregate(total=Sum("total_price"))
        total_revenue = revenue_agg["total"] or 0

        month_revenue_agg = Booking.objects.filter(
            payment_status=PaymentStatus.PAID,
            updated_at__date__gte=month_start,
        ).aggregate(total=Sum("total_price"))
        this_month_revenue = month_revenue_agg["total"] or 0

        data = {
            "total_billboards": total_billboards,
            "active_billboards": active_billboards,
            "total_bookings": total_bookings,
            "pending_bookings": pending_bookings,
            "total_revenue": total_revenue,
            "this_month_revenue": this_month_revenue,
        }
        return Response({"data": data, "meta": {}, "errors": []})


class BillboardAnalyticsView(APIView):
    """GET /v1/analytics/billboards/:id?period_start=&period_end="""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        from apps.billboards.models import Billboard

        billboard = generics.get_object_or_404(Billboard, pk=pk)

        # Permission: owner can only see their own; admin/finance see all
        user = request.user
        if not user.is_admin and user.role != "finance":
            owner = getattr(user, "owner_profile", None)
            if owner is None or billboard.owner != owner:
                return Response(
                    {"errors": [{"code": "permission_denied", "detail": "You do not have access to this billboard's analytics."}]},
                    status=403,
                )

        period_end = date.today()
        period_start = period_end - timedelta(days=30)

        try:
            period_start = date.fromisoformat(request.query_params.get("period_start", str(period_start)))
            period_end = date.fromisoformat(request.query_params.get("period_end", str(period_end)))
        except ValueError:
            return Response(
                {"errors": [{"code": "invalid_date", "detail": "period_start / period_end must be YYYY-MM-DD."}]},
                status=400,
            )

        metrics = DailyMetric.objects.filter(
            billboard=billboard, date__gte=period_start, date__lte=period_end
        )

        agg = metrics.aggregate(
            total_impressions=Sum("impressions"),
            total_bookings=Sum("bookings_count"),
            total_revenue=Sum("revenue"),
        )

        data = {
            "billboard_id": str(billboard.id),
            "billboard_title": billboard.title,
            "period_start": period_start,
            "period_end": period_end,
            "total_impressions": agg["total_impressions"] or 0,
            "total_bookings": agg["total_bookings"] or 0,
            "total_revenue": agg["total_revenue"] or 0,
            "daily_metrics": DailyMetricSerializer(metrics, many=True).data,
        }
        return Response({"data": data, "meta": {}, "errors": []})
