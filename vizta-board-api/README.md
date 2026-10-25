# Vizta Board API

Django 5 + DRF monolith for the Vizta Board out-of-home advertising platform.

## Architecture

| Layer | Technology |
|---|---|
| Framework | Django 5.0.9 + Django REST Framework 3.15 |
| Auth | Clerk (JWT via JWKS, webhook sync) |
| Database | PostgreSQL 16 |
| Cache / broker | Redis 7 |
| Async tasks | Celery 5.4 + Celery Beat (DatabaseScheduler) |
| Payments | Stripe SDK |
| Storage | AWS S3 + CloudFront |
| Email | AWS SES |
| Push | Expo Push API |
| Schema | drf-spectacular (OpenAPI 3) |

## Project structure

```
vizta-board-api/
├── config/               # Django project settings & WSGI/Celery entry points
│   └── settings/         # base / development / production
├── core/                 # Shared utilities (auth, permissions, pagination…)
├── apps/
│   ├── users/            # User model, Clerk webhook, audit log
│   ├── billboards/       # Billboard CRUD + availability
│   ├── bookings/         # Booking lifecycle + Stripe PaymentIntent
│   ├── finance/          # Invoices, settlements, Stripe webhook
│   ├── notifications/    # Email (SES), push (Expo), preferences
│   ├── analytics/        # Daily metrics aggregation
│   └── media/            # S3 presigned URL generation
├── manage.py
├── Dockerfile
└── docker-compose.yml
```

## Quick start (Docker)

```bash
cp .env.example .env          # Fill in secrets
docker compose up --build
```

The API is available at http://localhost:8000/v1/

- Swagger UI: http://localhost:8000/docs/
- ReDoc: http://localhost:8000/redoc/
- Django Admin: http://localhost:8000/admin/
- Celery Flower: http://localhost:5555/

## Local development (without Docker)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements.dev.txt

# Start Postgres and Redis (or use Docker for just those services)
docker compose up db redis -d

cp .env.example .env && vi .env

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Workers (separate terminals):

```bash
celery -A config worker --loglevel=info
celery -A config beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

## Running tests

```bash
pytest --cov=apps --cov-report=term-missing
```

## API reference

Full OpenAPI 3 schema: `GET /api/schema/`

### Auth flow

1. User signs up / logs in via **Clerk** (frontend SDK).
2. Clerk webhook `POST /v1/auth/webhook` syncs the user record to PostgreSQL.
3. The Clerk-issued **JWT** is sent as `Authorization: Bearer <token>` on every request.
4. `ClerkJWTAuthentication` (DRF) verifies the RS256 JWT via JWKS (cached in Redis).

### Key endpoints

| Method | Path | Role |
|---|---|---|
| POST | /v1/auth/webhook | Clerk (AllowAny + Svix sig) |
| GET | /v1/auth/me | Any authenticated |
| GET | /v1/users/ | admin+ |
| PATCH | /v1/users/:id/commission | super_admin |
| GET | /v1/billboards/ | Any (active only for public) |
| POST | /v1/billboards/ | billboard_owner |
| GET | /v1/billboards/:id/availability | Authenticated |
| GET | /v1/bookings/ | Own (advertiser) / all (admin, ops) |
| POST | /v1/bookings/ | advertiser |
| POST | /v1/bookings/:id/approve | admin, operations |
| POST | /v1/bookings/:id/payment | advertiser |
| GET | /v1/finance/invoices/ | owner (own), admin, finance |
| GET | /v1/finance/settlements/ | owner (own), admin, finance |
| POST | /v1/finance/settlements/compute | admin, finance |
| POST | /v1/finance/stripe/webhook | Stripe (AllowAny + sig) |
| GET | /v1/notifications/ | Own user |
| POST | /v1/media/presign | Authenticated |
| GET | /v1/analytics/overview | admin, finance |
| GET | /v1/analytics/billboards/:id | Owner (own), admin, finance |
| GET | /v1/audit-logs/ | admin+ |

## Environment variables

See `.env.example` for the full list. Required for production:

- `DJANGO_SECRET_KEY` — random 50+ char string
- `DATABASE_URL` — `postgres://user:pass@host:5432/db`
- `REDIS_URL` — `redis://host:6379/0`
- `CLERK_JWKS_URL` — from Clerk dashboard
- `CLERK_WEBHOOK_SECRET` — from Clerk dashboard → Webhooks
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_S3_BUCKET_NAME`
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
- `FIELD_ENCRYPTION_KEY` — random string, used to derive AES-256 key for bank details

## Celery Beat schedule (default)

Configure via Django Admin → Periodic Tasks:

| Task | Schedule | Description |
|---|---|---|
| `apps.analytics.tasks.aggregate_daily_metrics` | Daily 01:00 UTC | Aggregate previous day's metrics |
| `apps.finance.tasks.compute_settlements` | 1st of month | Monthly owner settlement |
