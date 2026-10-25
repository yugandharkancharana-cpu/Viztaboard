from rest_framework import serializers

from apps.users.serializers import BillboardOwnerSerializer

from .models import Billboard, BillboardStatus


class BillboardSerializer(serializers.ModelSerializer):
    owner = BillboardOwnerSerializer(read_only=True)
    owner_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = Billboard
        fields = [
            "id", "owner", "owner_id",
            "title", "description",
            "location_name", "latitude", "longitude", "city", "state", "country",
            "width_m", "height_m", "media_type", "illuminated", "facing_direction",
            "traffic_count", "visibility_score",
            "base_price_per_day", "status", "is_featured",
            "images",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "owner", "created_at", "updated_at"]

    def validate_images(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("images must be a list.")
        if len(value) > 10:
            raise serializers.ValidationError("Maximum 10 images per billboard.")
        return value


class BillboardCreateSerializer(BillboardSerializer):
    """Used by billboard owners to create their own billboard."""

    def create(self, validated_data):
        request = self.context["request"]
        # Auto-assign owner from the authenticated user's profile
        owner_profile = getattr(request.user, "owner_profile", None)
        if owner_profile is None:
            raise serializers.ValidationError(
                "Authenticated user does not have a billboard owner profile."
            )
        validated_data.pop("owner_id", None)
        validated_data["owner"] = owner_profile
        validated_data.setdefault("status", BillboardStatus.PENDING)
        return super().create(validated_data)


class BillboardAvailabilitySerializer(serializers.Serializer):
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    available = serializers.BooleanField(read_only=True)
    conflicting_bookings = serializers.ListField(
        child=serializers.UUIDField(), read_only=True
    )

    def validate(self, data):
        if data["start_date"] >= data["end_date"]:
            raise serializers.ValidationError("end_date must be after start_date.")
        return data
