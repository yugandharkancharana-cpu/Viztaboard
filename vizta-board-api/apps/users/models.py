"""
User management models.

User: extends AbstractBaseUser; linked to Clerk via clerk_id.
BillboardOwner: one-to-one profile for billboard_owner role.
AuditLog: immutable record of sensitive mutations.
"""
import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserRole(models.TextChoices):
    SUPER_ADMIN = "super_admin", "Super Admin"
    ADMIN = "admin", "Admin"
    BILLBOARD_OWNER = "billboard_owner", "Billboard Owner"
    ADVERTISER = "advertiser", "Advertiser"
    SALES_EXEC = "sales_exec", "Sales Executive"
    FINANCE = "finance", "Finance Team"
    OPERATIONS = "operations", "Operations Team"


class UserManager(BaseUserManager):
    def create_user(self, email: str, clerk_id: str, **extra_fields):
        if not email:
            raise ValueError("Email is required.")
        email = self.normalize_email(email)
        user = self.model(email=email, clerk_id=clerk_id, **extra_fields)
        user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, clerk_id: str, **extra_fields):
        extra_fields.setdefault("role", UserRole.SUPER_ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, clerk_id, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    clerk_id = models.CharField(max_length=128, unique=True, db_index=True)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=32, blank=True, default="")
    role = models.CharField(max_length=30, choices=UserRole.choices, default=UserRole.ADVERTISER)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["clerk_id", "full_name"]

    objects = UserManager()

    class Meta:
        db_table = "users"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.full_name} <{self.email}> [{self.role}]"

    # ── Convenience role checks ───────────────────────────────────────────────
    @property
    def is_admin(self):
        return self.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN)

    @property
    def is_billboard_owner(self):
        return self.role == UserRole.BILLBOARD_OWNER

    @property
    def is_advertiser(self):
        return self.role == UserRole.ADVERTISER


class BillboardOwner(models.Model):
    """Extended profile for users with role=billboard_owner."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="owner_profile")
    company_name = models.CharField(max_length=255, blank=True, default="")
    # Commission rate: percentage the platform retains (e.g. 15.00 = 15%)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=15.00)
    # Bank details stored AES-256 encrypted
    bank_details_encrypted = models.TextField(blank=True, default="")
    onboarded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "billboard_owners"

    def __str__(self):
        return f"{self.company_name or self.user.full_name} (owner)"

    def set_bank_details(self, details: dict):
        import json
        from core.utils import encrypt_field
        self.bank_details_encrypted = encrypt_field(json.dumps(details))

    def get_bank_details(self) -> dict:
        import json
        from core.utils import decrypt_field
        raw = decrypt_field(self.bank_details_encrypted)
        return json.loads(raw) if raw else {}


class AuditLog(models.Model):
    """Immutable audit trail for sensitive mutations."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="audit_logs"
    )
    action = models.CharField(max_length=128)  # e.g. "booking.approve"
    entity_type = models.CharField(max_length=64, blank=True, default="")
    entity_id = models.UUIDField(null=True, blank=True)
    metadata = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    occurred_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "audit_logs"
        ordering = ["-occurred_at"]
        # Append-only: never update
        default_permissions = ("view",)

    def __str__(self):
        return f"{self.action} by {self.actor_id} at {self.occurred_at}"
