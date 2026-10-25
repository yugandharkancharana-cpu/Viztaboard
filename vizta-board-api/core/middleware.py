"""
Request-level middleware:
  • ClerkJWTMiddleware  — light presence check (auth done by DRF authenticator)
  • AuditLogMiddleware — writes audit records for mutating requests on sensitive paths
"""
import json
import logging

from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)

_AUDIT_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
_AUDIT_PATH_PREFIXES = ("/v1/bookings/", "/v1/auth/", "/v1/finance/settlements/")


class ClerkJWTMiddleware(MiddlewareMixin):
    """
    Lightweight middleware that does nothing but set request.clerk_token
    so views can inspect raw claims if needed. Actual verification happens
    inside ClerkJWTAuthentication (DRF layer).
    """

    def process_request(self, request):
        auth = request.META.get("HTTP_AUTHORIZATION", "")
        request.clerk_token = auth.split(" ", 1)[1] if auth.startswith("Bearer ") else None


class AuditLogMiddleware(MiddlewareMixin):
    """
    After a mutating request on a sensitive path completes, write an
    AuditLog record asynchronously (best-effort).
    """

    def process_response(self, request, response):
        if request.method not in _AUDIT_METHODS:
            return response
        if not any(request.path.startswith(p) for p in _AUDIT_PATH_PREFIXES):
            return response
        if not hasattr(request, "user") or not request.user.is_authenticated:
            return response

        try:
            from apps.users.models import AuditLog  # lazy import

            body = {}
            try:
                body = json.loads(request.body.decode("utf-8")) if request.body else {}
            except Exception:
                pass

            AuditLog.objects.create(
                actor=request.user,
                action=f"{request.method} {request.path}",
                entity_type="request",
                entity_id=None,
                metadata={
                    "path": request.path,
                    "method": request.method,
                    "status": response.status_code,
                    "body_keys": list(body.keys()),
                },
                ip_address=_get_client_ip(request),
            )
        except Exception as exc:
            logger.warning("AuditLog write failed: %s", exc)

        return response


def _get_client_ip(request) -> str:
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")
