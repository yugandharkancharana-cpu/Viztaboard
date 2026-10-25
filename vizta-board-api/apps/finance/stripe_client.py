"""
Thin wrapper around the Stripe SDK for finance operations.
All Stripe calls live here so the rest of the codebase stays SDK-agnostic.
"""
import logging

import stripe
from django.conf import settings

logger = logging.getLogger(__name__)


def _client() -> stripe:
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


def create_payment_intent(amount_cents: int, currency: str = "ngn", metadata: dict | None = None) -> dict:
    """Create a PaymentIntent and return the raw Stripe object as a dict."""
    client = _client()
    intent = client.PaymentIntent.create(
        amount=amount_cents,
        currency=currency,
        metadata=metadata or {},
        payment_method_types=["card"],
    )
    return intent


def retrieve_payment_intent(intent_id: str) -> dict:
    client = _client()
    return client.PaymentIntent.retrieve(intent_id)


def create_payout(amount_cents: int, currency: str = "ngn", metadata: dict | None = None) -> dict:
    """Create a Stripe Payout (requires a connected account in practice)."""
    client = _client()
    payout = client.Payout.create(
        amount=amount_cents,
        currency=currency,
        metadata=metadata or {},
    )
    return payout


def construct_webhook_event(payload: bytes, sig_header: str) -> dict:
    """Verify and construct a Stripe webhook event."""
    client = _client()
    return client.Webhook.construct_event(
        payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
    )
