"""
Billboard endpoints:
  GET    /v1/billboards/               — public list (active)
  POST   /v1/billboards/               — create (billboard_owner)
  GET    /v1/billboards/:id/           — detail (public)
  PATCH  /v1/billboards/:id/           — update (owner or admin)
  DELETE /v1/billboards/:id/           — soft-delete (owner or admin)
  GET    /v1/billboards/:id/availability — check date availability
"""
import logging

from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsAdmin, IsAdminOrOwner, IsBillboardOwner

from .filters import BillboardFilter
from .models import Billboard, BillboardStatus
from .serializers import (
    BillboardAvailabilitySerializer,
    BillboardCreateSerializer,
    BillboardSerializer,
)

logger = logging.getLogger(__name__)


class BillboardListView(generics.ListCreateAPIView):
    """
    GET  /v1/billboards/ — any authenticated user can browse active billboards;
                           admins can also see pending/inactive ones.
    POST /v1/billboards/ — billboard owner creates a new billboard.
    """

    filterset_class = BillboardFilter
    search_fields = ["title", "location_name", "city", "state"]
    ordering_fields = ["created_at", "base_price_per_day", "visibility_score"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = Billboard.objects.select_related("owner__user").all()
        user = self.request.user
        if user.is_authenticated and user.is_admin:
            return qs
        if user.is_authenticated and user.role == "billboard_owner":
            owner_profile = getattr(user, "owner_profile", None)
            if owner_profile:
                return qs.filter(
                    Q(status=BillboardStatus.ACTIVE) | Q(owner=owner_profile)
                )
        return qs.filter(status=BillboardStatus.ACTIVE)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return BillboardCreateSerializer
        return BillboardSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), IsBillboardOwner()]
        return [permissions.IsAuthenticatedOrReadOnly()]


class BillboardDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /v1/billboards/:id/  — public
    PATCH  /v1/billboards/:id/  — owner or admin
    DELETE /v1/billboards/:id/  — owner or admin (soft delete → inactive)
    """

    queryset = Billboard.objects.select_related("owner__user").all()
    serializer_class = BillboardSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdminOrOwner()]

    def perform_destroy(self, instance):
        # Soft delete: mark inactive instead of removing the row
        instance.status = BillboardStatus.INACTIVE
        instance.save(update_fields=["status"])

    def check_object_permissions(self, request, obj):
        """
        IsAdminOrOwner checks obj.owner.user == request.user for owner role.
        We adapt the object to satisfy that interface.
        """
        super().check_object_permissions(request, obj)


class BillboardAvailabilityView(APIView):
    """GET /v1/billboards/:id/availability?start_date=&end_date="""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        billboard = generics.get_object_or_404(
            Billboard, pk=pk, status=BillboardStatus.ACTIVE
        )
        serializer = BillboardAvailabilitySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        start = serializer.validated_data["start_date"]
        end = serializer.validated_data["end_date"]

        # Circular import guard — bookings app may not exist yet
        try:
            from apps.bookings.models import Booking, BookingStatus

            conflicts = Booking.objects.filter(
                billboard=billboard,
                status__in=[BookingStatus.PENDING, BookingStatus.APPROVED],
            ).filter(
                Q(start_date__lt=end) & Q(end_date__gt=start)
            )
            conflicting_ids = list(conflicts.values_list("id", flat=True))
            available = not conflicts.exists()
        except Exception:
            conflicting_ids = []
            available = True

        data = {
            "start_date": start,
            "end_date": end,
            "available": available,
            "conflicting_bookings": conflicting_ids,
        }
        return Response({"data": data, "meta": {}, "errors": []})
