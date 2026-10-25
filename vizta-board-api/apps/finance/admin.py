from django.contrib import admin

from .models import Invoice, Settlement


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = [
        "invoice_number", "booking", "amount_gross", "platform_fee",
        "amount_net", "status", "due_date", "paid_at",
    ]
    list_filter = ["status"]
    search_fields = ["invoice_number", "booking__campaign_name", "booking__advertiser__email"]
    readonly_fields = list(f.name for f in Invoice._meta.fields if f.name != "status")
    date_hierarchy = "created_at"


@admin.register(Settlement)
class SettlementAdmin(admin.ModelAdmin):
    list_display = [
        "owner", "period_start", "period_end",
        "invoices_count", "gross_revenue", "platform_commission",
        "net_payout", "status",
    ]
    list_filter = ["status"]
    search_fields = ["owner__company_name", "owner__user__email"]
    readonly_fields = list(f.name for f in Settlement._meta.fields if f.name not in ("status",))
    raw_id_fields = ["owner"]
    date_hierarchy = "created_at"
