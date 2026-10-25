from rest_framework import serializers

from .models import Notification, NotificationPreference, PushToken


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id", "notification_type", "channel", "title", "body",
            "data", "status", "is_read", "sent_at", "created_at",
        ]
        read_only_fields = fields


class PushTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushToken
        fields = ["id", "token", "platform", "is_active", "created_at"]
        read_only_fields = ["id", "is_active", "created_at"]

    def create(self, validated_data):
        user = self.context["request"].user
        token, _ = PushToken.objects.update_or_create(
            user=user,
            token=validated_data["token"],
            defaults={"platform": validated_data.get("platform", "ios"), "is_active": True},
        )
        return token


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ["email_enabled", "push_enabled", "sms_enabled"]
