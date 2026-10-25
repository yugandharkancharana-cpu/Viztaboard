"""
RBAC permission classes for Vizta Board.

Every view declares the roles allowed via `role_permissions` or uses one
of the convenience classes below.
"""
from rest_framework.permissions import BasePermission


class RolePermission(BasePermission):
    """
    Base class. Subclasses declare `allowed_roles`.
    """

    allowed_roles: tuple[str, ...] = ()

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in self.allowed_roles


# ── Convenience classes ───────────────────────────────────────────────────────

class IsSuperAdmin(RolePermission):
    allowed_roles = ("super_admin",)


class IsAdmin(RolePermission):
    """Matches admin OR super_admin."""
    allowed_roles = ("admin", "super_admin")


class IsFinanceTeam(RolePermission):
    allowed_roles = ("finance", "super_admin")


class IsBillboardOwner(RolePermission):
    allowed_roles = ("billboard_owner", "super_admin")


class IsAdvertiser(RolePermission):
    allowed_roles = ("advertiser",)


class IsSalesExec(RolePermission):
    allowed_roles = ("sales_exec", "super_admin")


class IsOperations(RolePermission):
    allowed_roles = ("operations", "admin", "super_admin")


class IsAdminOrOwner(BasePermission):
    """Admin/super_admin OR a billboard owner managing their own record."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ("admin", "super_admin", "billboard_owner")

    def has_object_permission(self, request, view, obj):
        if request.user.role in ("admin", "super_admin"):
            return True
        # Billboard owner may only touch their own billboard
        if request.user.role == "billboard_owner":
            billboard = getattr(obj, "billboard", obj)
            owner = getattr(billboard, "owner", None)
            if owner:
                return owner.user_id == request.user.id
        return False


class IsOwnerOrReadOnly(BasePermission):
    """
    Safe methods are always allowed. Mutations require the user to own the object
    (via obj.advertiser / obj.user) or to be an admin.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        from rest_framework.permissions import SAFE_METHODS

        if request.method in SAFE_METHODS:
            return True
        if request.user.role in ("admin", "super_admin"):
            return True
        owner = getattr(obj, "advertiser", getattr(obj, "user", None))
        return owner == request.user
