from django.urls import path

from . import views

urlpatterns = [
    path("notifications/", views.NotificationListView.as_view(), name="notification-list"),
    path("notifications/mark-all-read", views.NotificationMarkAllReadView.as_view(), name="notification-mark-all-read"),
    path("notifications/<uuid:pk>/read", views.NotificationMarkReadView.as_view(), name="notification-read"),
    path("notifications/preferences", views.NotificationPreferenceView.as_view(), name="notification-preferences"),
    path("notifications/push-tokens", views.PushTokenView.as_view(), name="push-tokens"),
]
