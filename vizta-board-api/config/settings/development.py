from .base import *  # noqa: F401, F403

DEBUG = True

INSTALLED_APPS += ["django_extensions"]  # noqa: F405

# Use local media in dev
DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"

# Relax CORS in dev
CORS_ALLOW_ALL_ORIGINS = True

# Email to console
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Disable throttling in dev
REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []  # noqa: F405
