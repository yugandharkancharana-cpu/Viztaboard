from django.contrib import admin

from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = [
        "id", "billboard", "advertiser", "start_date", "end_date",
        "num_days", "total_price", "status", "payment_status", "created_at",
    ]
    list_filter = ["status", "payment_status"]
    search_fields = [
        "campaign_name", "billboard__title",
        "advertiser__email", "advertiser__full_name",
    ]
    readonly_fields = [
        "id", "num_days", "price_per_day", "total_price",
        "stripe_payment_intent_id", "stripe_client_secret",
        "created_at", "updated_at",
    ]
    raw_id_fields = ["billboard", "advertiser", "reviewed_by"]
    date_hierarchy = "created_at"

    fieldsets = (
        ("Identity", {"fields": ("id", "billboard", "advertiser", "campaign_name")}),
        ("Campaign", {"fields": ("start_date", "end_date", "num_days", "creative_assets", "notes")}),
        ("Pricing", {"fields": ("price_per_day", "total_price")}),
        ("Status", {"fields": ("status", "rejection_reason", "reviewed_at", "reviewed_by")}),
        ("Payment", {"fields": ("payment_status", "stripe_payment_intent_id", "stripe_client_secret")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )
