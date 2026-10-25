from django.contrib import admin

from .models import Notification, NotificationPreference, PushToken


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["user", "notification_type", "channel", "status", "is_read", "created_at"]
    list_filter = ["notification_type", "channel", "status", "is_read"]
    search_fields = ["user__email", "title"]
    readonly_fields = ["id", "created_at", "sent_at"]
    raw_id_fields = ["user"]
    date_hierarchy = "created_at"


@admin.register(PushToken)
class PushTokenAdmin(admin.ModelAdmin):
    list_display = ["user", "platform", "is_active", "created_at"]
    list_filter = ["platform", "is_active"]
    search_fields = ["user__email", "token"]
    raw_id_fields = ["user"]
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ["user", "email_enabled", "push_enabled", "sms_enabled"]
    search_fields = ["user__email"]
    raw_id_fields = ["user"]
    readonly_fields = ["id"]
