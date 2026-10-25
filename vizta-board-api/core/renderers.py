"""
Custom DRF renderer that wraps all responses in the Vizta envelope:
  { data: <payload>, meta: {…}, errors: [] }
"""
import json

from rest_framework.renderers import JSONRenderer
from rest_framework.utils.serializer_helpers import ReturnList


class EnvelopeJSONRenderer(JSONRenderer):
    """
    Wraps successful responses in:
        { "data": <payload>, "meta": {…} }

    Error responses produced by the exception handler are already wrapped,
    so we pass them through unchanged.
    """

    def render(self, data, accepted_media_type=None, renderer_context=None):
        renderer_context = renderer_context or {}
        response = renderer_context.get("response")

        # If the response is already wrapped (has 'errors' key) pass through
        if isinstance(data, dict) and "errors" in data:
            return super().render(data, accepted_media_type, renderer_context)

        # Build meta block for paginated responses
        meta = {}
        payload = data

        if isinstance(data, dict):
            # DRF paginated response has count / next / previous / results
            if "results" in data and "count" in data:
                meta = {
                    "count": data.get("count"),
                    "next": data.get("next"),
                    "previous": data.get("previous"),
                }
                payload = data.get("results")
            elif "__meta__" in data:
                meta = data.pop("__meta__")

        wrapped = {"data": payload, "meta": meta, "errors": []}
        return super().render(wrapped, accepted_media_type, renderer_context)
