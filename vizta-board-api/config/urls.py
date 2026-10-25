"""
Root URL configuration — all /v1/ routes delegated to domain apps.
"""
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

api_v1 = [
    # ── Auth / users ──────────────────────────────────
    path("auth/", include("apps.users.urls")),
    # ── Billboards ────────────────────────────────────
    path("billboards/", include("apps.billboards.urls")),
    # ── Bookings ──────────────────────────────────────
    path("bookings/", include("apps.bookings.urls")),
    # ── Finance (invoices, payments, settlements) ─────
    path("", include("apps.finance.urls")),
    # ── Notifications ─────────────────────────────────
    path("notifications/", include("apps.notifications.urls")),
    # ── Analytics ─────────────────────────────────────
    path("analytics/", include("apps.analytics.urls")),
    # ── Media ─────────────────────────────────────────
    path("media/", include("apps.media.urls")),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    # REST API
    path("v1/", include(api_v1)),
    # OpenAPI docs
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
