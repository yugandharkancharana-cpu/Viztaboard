from django.urls import path

from . import views

urlpatterns = [
    # Auth
    path("auth/webhook", views.ClerkWebhookView.as_view(), name="clerk-webhook"),
    path("auth/me", views.MeView.as_view(), name="me"),
    # Users
    path("users/", views.UserListView.as_view(), name="user-list"),
    path("users/<uuid:pk>/commission", views.CommissionRateView.as_view(), name="user-commission"),
    # Audit
    path("audit-logs/", views.AuditLogListView.as_view(), name="audit-log-list"),
]
