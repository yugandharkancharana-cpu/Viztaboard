from django.urls import path

from . import views

urlpatterns = [
    # Invoices
    path("finance/invoices/", views.InvoiceListView.as_view(), name="invoice-list"),
    path("finance/invoices/<uuid:pk>/", views.InvoiceDetailView.as_view(), name="invoice-detail"),
    # Settlements
    path("finance/settlements/", views.SettlementListView.as_view(), name="settlement-list"),
    path("finance/settlements/compute", views.SettlementComputeView.as_view(), name="settlement-compute"),
    # Stripe
    path("finance/stripe/webhook", views.StripeWebhookView.as_view(), name="stripe-webhook"),
]
