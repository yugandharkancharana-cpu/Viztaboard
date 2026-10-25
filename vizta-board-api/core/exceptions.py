"""
Custom exception handler — formats all errors into the Vizta envelope:
  { data: null, meta: {}, errors: [{ code, detail, attr }] }
"""
import logging

from django.core.exceptions import PermissionDenied, ValidationError
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def vizta_exception_handler(exc, context):
    """
    Convert every exception into the standard error envelope.
    """
    # DRF default handling first (sets response for HTTP exceptions)
    response = exception_handler(exc, context)

    if response is None:
        # Unexpected server error — log it
        logger.exception("Unhandled exception: %s", exc)
        errors = [{"code": "server_error", "detail": "An unexpected error occurred.", "attr": None}]
        return Response(
            {"data": None, "meta": {}, "errors": errors},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    errors = _extract_errors(response.data)
    return Response(
        {"data": None, "meta": {}, "errors": errors},
        status=response.status_code,
    )


def _extract_errors(data) -> list:
    """
    Flatten DRF's nested error dict/list into a flat list of
    {code, detail, attr} objects.
    """
    errors = []

    if isinstance(data, list):
        for item in data:
            errors.extend(_extract_errors(item))
    elif isinstance(data, dict):
        for key, value in data.items():
            if key in ("detail", "non_field_errors"):
                attr = None if key == "detail" else key
                if isinstance(value, list):
                    for v in value:
                        errors.append(_make_error(v, attr))
                else:
                    errors.append(_make_error(value, attr))
            else:
                if isinstance(value, list):
                    for v in value:
                        errors.append(_make_error(v, key))
                elif isinstance(value, dict):
                    errors.extend(_extract_errors(value))
                else:
                    errors.append(_make_error(value, key))
    else:
        errors.append(_make_error(data, None))

    return errors


def _make_error(value, attr) -> dict:
    if hasattr(value, "code"):
        code = str(value.code)
        detail = str(value)
    else:
        code = "invalid"
        detail = str(value)
    return {"code": code, "detail": detail, "attr": attr}
