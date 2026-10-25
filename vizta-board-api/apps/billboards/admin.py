from django.contrib import admin

from .models import Billboard


@admin.register(Billboard)
class BillboardAdmin(admin.ModelAdmin):
    list_display = [
        "title", "owner", "city", "state", "media_type",
        "status", "base_price_per_day", "visibility_score", "is_featured",
    ]
    list_filter = ["status", "media_type", "illuminated", "is_featured", "country"]
    search_fields = ["title", "location_name", "city", "owner__company_name", "owner__user__email"]
    readonly_fields = ["id", "created_at", "updated_at"]
    raw_id_fields = ["owner"]
    fieldsets = (
        ("Identity", {"fields": ("id", "title", "description", "owner")}),
        ("Location", {"fields": ("location_name", "latitude", "longitude", "city", "state", "country")}),
        ("Physical", {"fields": ("width_m", "height_m", "media_type", "illuminated", "facing_direction")}),
        ("Commercial", {"fields": ("base_price_per_day", "status", "is_featured", "traffic_count", "visibility_score")}),
        ("Media", {"fields": ("images",)}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    actions = ["mark_active", "mark_inactive"]

    @admin.action(description="Mark selected billboards as Active")
    def mark_active(self, request, queryset):
        queryset.update(status="active")

    @admin.action(description="Mark selected billboards as Inactive")
    def mark_inactive(self, request, queryset):
        queryset.update(status="inactive")
