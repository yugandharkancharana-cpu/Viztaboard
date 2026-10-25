from django.urls import path

from . import views

urlpatterns = [
    path("bookings/", views.BookingListView.as_view(), name="booking-list"),
    path("bookings/<uuid:pk>/", views.BookingDetailView.as_view(), name="booking-detail"),
    path("bookings/<uuid:pk>/approve", views.BookingApproveView.as_view(), name="booking-approve"),
    path("bookings/<uuid:pk>/reject", views.BookingRejectView.as_view(), name="booking-reject"),
    path("bookings/<uuid:pk>/cancel", views.BookingCancelView.as_view(), name="booking-cancel"),
    path("bookings/<uuid:pk>/payment", views.BookingPaymentView.as_view(), name="booking-payment"),
]
