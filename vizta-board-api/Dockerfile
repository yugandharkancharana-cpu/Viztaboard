# syntax=docker/dockerfile:1
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# System deps (psycopg2, cryptography, Pillow, reportlab)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc g++ libffi-dev libssl-dev \
    libjpeg-dev zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# ── deps layer (cached unless requirements change) ─────────────────────────────
FROM base AS deps
COPY requirements.txt .
RUN pip install --break-system-packages -r requirements.txt

# ── final image ────────────────────────────────────────────────────────────────
FROM deps AS app
COPY . .

# Non-root user
RUN addgroup --system app && adduser --system --ingroup app app
RUN chown -R app:app /app
USER app

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "4", \
     "--worker-class", "sync", \
     "--timeout", "120", \
     "--log-level", "info", \
     "--access-logfile", "-"]
