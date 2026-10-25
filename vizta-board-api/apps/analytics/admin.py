from django.contrib import admin

from .models import DailyMetric


@admin.register(DailyMetric)
class DailyMetricAdmin(admin.ModelAdmin):
    list_display = ("billboard", "date", "impressions", "unique_views", "bookings_count", "revenue")
    list_filter = ("date", "billboard__city", "billboard__status")
    search_fields = ("billboard__title", "billboard__owner__user__email")
    date_hierarchy = "date"
    ordering = ("-date",)
    readonly_fields = (
        "billboard",
        "date",
        "impressions",
        "unique_views",
        "bookings_count",
        "booking_requests",
        "revenue",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
