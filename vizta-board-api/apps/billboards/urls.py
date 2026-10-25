from django.urls import path

from . import views

urlpatterns = [
    path("billboards/", views.BillboardListView.as_view(), name="billboard-list"),
    path("billboards/<uuid:pk>/", views.BillboardDetailView.as_view(), name="billboard-detail"),
    path(
        "billboards/<uuid:pk>/availability",
        views.BillboardAvailabilityView.as_view(),
        name="billboard-availability",
    ),
]
