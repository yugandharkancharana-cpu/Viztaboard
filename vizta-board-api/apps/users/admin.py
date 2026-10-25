from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import AuditLog, BillboardOwner, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ["email", "full_name", "role", "is_active", "created_at"]
    list_filter = ["role", "is_active"]
    search_fields = ["email", "full_name", "clerk_id"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "clerk_id", "created_at", "updated_at"]

    fieldsets = (
        (None, {"fields": ("id", "clerk_id", "email", "full_name", "phone")}),
        ("Permissions", {"fields": ("role", "is_active", "is_staff", "is_superuser")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "clerk_id", "full_name", "role"),
        }),
    )

    def get_form(self, request, obj=None, **kwargs):
        # Remove password fields — auth is delegated to Clerk
        kwargs.setdefault("exclude", ["password"])
        return super().get_form(request, obj, **kwargs)


@admin.register(BillboardOwner)
class BillboardOwnerAdmin(admin.ModelAdmin):
    list_display = ["company_name", "user", "commission_rate", "onboarded_at"]
    search_fields = ["company_name", "user__email", "user__full_name"]
    readonly_fields = ["id"]
    raw_id_fields = ["user"]


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ["action", "actor", "entity_type", "entity_id", "ip_address", "occurred_at"]
    list_filter = ["action", "entity_type"]
    search_fields = ["actor__email", "action", "entity_type"]
    readonly_fields = [
        "id", "actor", "action", "entity_type", "entity_id",
        "metadata", "ip_address", "occurred_at",
    ]
    date_hierarchy = "occurred_at"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
