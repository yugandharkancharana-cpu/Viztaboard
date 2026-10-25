"""
Booking domain services.

PricingEngine: calculates total price for a booking.
"""
import decimal
import logging
from datetime import date

from apps.billboards.models import Billboard

logger = logging.getLogger(__name__)

# Visibility-score price multipliers
_VISIBILITY_MULTIPLIERS = [
    (90, decimal.Decimal("1.30")),
    (75, decimal.Decimal("1.15")),
    (50, decimal.Decimal("1.00")),
    (25, decimal.Decimal("0.85")),
    (0,  decimal.Decimal("0.70")),
]

# Duration discounts (min days → discount %)
_DURATION_DISCOUNTS = [
    (30, decimal.Decimal("0.10")),
    (14, decimal.Decimal("0.05")),
    (7,  decimal.Decimal("0.02")),
    (0,  decimal.Decimal("0.00")),
]


class PricingEngine:
    """
    Calculates the total booking price using:
      base_price_per_day × visibility_multiplier × num_days × (1 - duration_discount)
    """

    def __init__(self, billboard: Billboard):
        self.billboard = billboard

    def _visibility_multiplier(self) -> decimal.Decimal:
        score = self.billboard.visibility_score
        for threshold, mult in _VISIBILITY_MULTIPLIERS:
            if score >= threshold:
                return mult
        return decimal.Decimal("1.00")

    def _duration_discount(self, num_days: int) -> decimal.Decimal:
        for min_days, discount in _DURATION_DISCOUNTS:
            if num_days >= min_days:
                return discount
        return decimal.Decimal("0.00")

    def calculate(self, start_date: date, end_date: date) -> dict:
        """
        Returns:
            {
                "num_days": int,
                "price_per_day": Decimal,  # base price × visibility multiplier
                "subtotal": Decimal,
                "discount_rate": Decimal,
                "discount_amount": Decimal,
                "total": Decimal,
            }
        """
        num_days = max((end_date - start_date).days, 0)
        multiplier = self._visibility_multiplier()
        price_per_day = (self.billboard.base_price_per_day * multiplier).quantize(
            decimal.Decimal("0.01")
        )
        subtotal = (price_per_day * num_days).quantize(decimal.Decimal("0.01"))
        discount_rate = self._duration_discount(num_days)
        discount_amount = (subtotal * discount_rate).quantize(decimal.Decimal("0.01"))
        total = (subtotal - discount_amount).quantize(decimal.Decimal("0.01"))

        return {
            "num_days": num_days,
            "price_per_day": price_per_day,
            "subtotal": subtotal,
            "discount_rate": discount_rate,
            "discount_amount": discount_amount,
            "total": total,
        }
