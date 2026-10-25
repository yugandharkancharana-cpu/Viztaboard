from .base import *  # noqa: F401, F403

DEBUG = False

# ── Security headers ──────────────────────────────────────────────────────────
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# ── S3 media storage ──────────────────────────────────────────────────────────
DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"
STATICFILES_STORAGE = "storages.backends.s3boto3.S3StaticStorage"
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = "private"
AWS_S3_OBJECT_PARAMETERS = {"CacheControl": "max-age=86400"}
AWS_STORAGE_BUCKET_NAME = AWS_S3_BUCKET_NAME  # noqa: F405

# ── Email via SES ─────────────────────────────────────────────────────────────
EMAIL_BACKEND = "django_ses.SESBackend"

# ── Rate limiting ─────────────────────────────────────────────────────────────
REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = [  # noqa: F405
    "rest_framework.throttling.AnonRateThrottle",
    "rest_framework.throttling.UserRateThrottle",
]
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {  # noqa: F405
    "anon": "100/hour",
    "user": "1000/hour",
}
