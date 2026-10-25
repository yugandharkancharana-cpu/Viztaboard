from django.urls import path

from . import views

urlpatterns = [
    path("analytics/overview", views.AnalyticsOverviewView.as_view(), name="analytics-overview"),
    path("analytics/billboards/<uuid:pk>", views.BillboardAnalyticsView.as_view(), name="analytics-billboard"),
]
