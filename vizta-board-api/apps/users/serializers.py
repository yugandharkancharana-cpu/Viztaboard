from rest_framework import serializers

from .models import AuditLog, BillboardOwner, User


class BillboardOwnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillboardOwner
        fields = ["id", "company_name", "commission_rate", "onboarded_at"]
        read_only_fields = ["id", "commission_rate", "onboarded_at"]


class UserSerializer(serializers.ModelSerializer):
    owner_profile = BillboardOwnerSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "clerk_id", "email", "full_name", "phone",
            "role", "is_active", "owner_profile", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "clerk_id", "created_at", "updated_at"]


class UserCreateSerializer(serializers.ModelSerializer):
    """Used by the Clerk webhook to create/sync users."""

    class Meta:
        model = User
        fields = ["clerk_id", "email", "full_name", "phone", "role"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class CommissionRateSerializer(serializers.Serializer):
    commission_rate = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=0, max_value=100)

    def update(self, instance: BillboardOwner, validated_data):
        instance.commission_rate = validated_data["commission_rate"]
        instance.save(update_fields=["commission_rate"])
        return instance


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.full_name", read_only=True)

    class Meta:
        model = AuditLog
        fields = ["id", "actor_name", "action", "entity_type", "entity_id",
                  "metadata", "ip_address", "occurred_at"]
