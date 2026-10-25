"""
Clerk JWT authentication backend for DRF.

Verifies the Bearer token issued by Clerk, then resolves the matching
local User record. Returns (user, token) on success; raises AuthenticationFailed
on any validation error.
"""
import logging
from typing import Optional, Tuple

import jwt
import requests
from django.conf import settings
from django.core.cache import cache
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request

logger = logging.getLogger(__name__)

JWKS_CACHE_KEY = "clerk_jwks"
JWKS_CACHE_TTL = 3600  # 1 hour


def _get_jwks() -> dict:
    """Fetch and cache Clerk's JWKS (public key set)."""
    jwks = cache.get(JWKS_CACHE_KEY)
    if jwks:
        return jwks
    resp = requests.get(settings.CLERK_JWKS_URL, timeout=10)
    resp.raise_for_status()
    jwks = resp.json()
    cache.set(JWKS_CACHE_KEY, jwks, JWKS_CACHE_TTL)
    return jwks


def _decode_clerk_jwt(token: str) -> dict:
    """Decode and verify a Clerk JWT against the JWKS."""
    try:
        jwks = _get_jwks()
        public_keys = {}
        for key_data in jwks.get("keys", []):
            kid = key_data.get("kid")
            public_keys[kid] = jwt.algorithms.RSAAlgorithm.from_jwk(key_data)

        # Decode header to get kid
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        public_key = public_keys.get(kid)
        if not public_key:
            raise AuthenticationFailed("Unknown JWT key ID.")

        payload = jwt.decode(
            token,
            key=public_key,
            algorithms=["RS256"],
            options={"verify_exp": True},
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed("Token has expired.")
    except jwt.InvalidTokenError as exc:
        raise AuthenticationFailed(f"Invalid token: {exc}")
    except Exception as exc:
        logger.warning("JWT decode error: %s", exc)
        raise AuthenticationFailed("Token validation failed.")


class ClerkJWTAuthentication(BaseAuthentication):
    """
    DRF authentication class that validates Clerk JWTs.

    Resolves (or creates) the matching local User from the clerk_id claim.
    """

    def authenticate(self, request: Request) -> Optional[Tuple]:
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            return None  # Let the next authenticator try

        token = auth_header.split(" ", 1)[1]
        payload = _decode_clerk_jwt(token)

        clerk_id = payload.get("sub")
        if not clerk_id:
            raise AuthenticationFailed("Token missing 'sub' claim.")

        from apps.users.models import User  # avoid circular imports

        try:
            user = User.objects.get(clerk_id=clerk_id)
        except User.DoesNotExist:
            raise AuthenticationFailed(
                "User not found. Ensure the Clerk webhook has synced."
            )

        if not user.is_active:
            raise AuthenticationFailed("User account is disabled.")

        return (user, token)

    def authenticate_header(self, request: Request) -> str:
        return "Bearer"
