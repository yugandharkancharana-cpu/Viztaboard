"""
Celery tasks for the finance domain.

compute_settlements: run on a schedule (monthly) to aggregate paid bookings
                     into Settlement + Invoice records.
generate_invoice_pdf: generate PDF for a given invoice and upload to S3.
"""
import decimal
import logging
from datetime import date, datetime, timezone

from celery import shared_task
from django.db import transaction

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def compute_settlements(self, period_start: str, period_end: str, owner_id: str | None = None):
    """
    Aggregate paid invoices per billboard owner for the given period.
    Creates or updates Settlement rows.

    Args:
        period_start: ISO date string "YYYY-MM-DD"
        period_end:   ISO date string "YYYY-MM-DD"
        owner_id:     UUID string; if None, processes all owners.
    """
    from apps.bookings.models import Booking, BookingStatus, PaymentStatus
    from apps.finance.models import Invoice, InvoiceStatus, Settlement, SettlementStatus
    from apps.users.models import BillboardOwner
    from core.utils import generate_invoice_number

    start = date.fromisoformat(period_start)
    end = date.fromisoformat(period_end)

    owners_qs = BillboardOwner.objects.all()
    if owner_id:
        owners_qs = owners_qs.filter(id=owner_id)

    created_count = 0
    for owner in owners_qs:
        try:
            with transaction.atomic():
                # Paid bookings in this period for this owner
                bookings = Booking.objects.filter(
                    billboard__owner=owner,
                    status=BookingStatus.COMPLETED,
                    payment_status=PaymentStatus.PAID,
                    end_date__gte=start,
                    start_date__lte=end,
                ).select_related("billboard")

                if not bookings.exists():
                    continue

                gross = sum(b.total_price for b in bookings)
                gross = decimal.Decimal(str(gross))
                commission_rate = owner.commission_rate / decimal.Decimal("100")
                commission = (gross * commission_rate).quantize(decimal.Decimal("0.01"))
                net = gross - commission

                settlement, _ = Settlement.objects.get_or_create(
                    owner=owner,
                    period_start=start,
                    period_end=end,
                    defaults={
                        "status": SettlementStatus.PENDING,
                        "invoices_count": bookings.count(),
                        "gross_revenue": gross,
                        "platform_commission": commission,
                        "net_payout": net,
                        "initiated_at": datetime.now(timezone.utc),
                    },
                )

                # Create invoices for bookings that don't have one yet
                for booking in bookings:
                    if not hasattr(booking, "invoice"):
                        Invoice.objects.create(
                            booking=booking,
                            invoice_number=generate_invoice_number(str(owner.id)),
                            amount_gross=booking.total_price,
                            platform_fee_rate=owner.commission_rate,
                        )

                created_count += 1
                logger.info("Settlement created/updated for owner %s: %s", owner.id, settlement.id)

        except Exception as exc:
            logger.exception("Failed to compute settlement for owner %s: %s", owner.id, exc)
            self.retry(exc=exc)

    return {"settlements_processed": created_count}


@shared_task(bind=True, max_retries=3)
def generate_invoice_pdf(self, invoice_id: str):
    """Generate a PDF for the given invoice and upload to S3."""
    try:
        from apps.finance.models import Invoice

        invoice = Invoice.objects.select_related(
            "booking__billboard__owner__user", "booking__advertiser"
        ).get(pk=invoice_id)

        pdf_bytes = _render_invoice_pdf(invoice)

        from apps.media.s3_client import upload_bytes

        s3_key = f"invoices/{invoice.invoice_number}.pdf"
        upload_bytes(pdf_bytes, s3_key, content_type="application/pdf")

        invoice.pdf_s3_key = s3_key
        invoice.save(update_fields=["pdf_s3_key"])
        logger.info("Invoice PDF generated: %s", s3_key)
        return {"pdf_s3_key": s3_key}

    except Exception as exc:
        logger.exception("Failed to generate invoice PDF %s: %s", invoice_id, exc)
        raise self.retry(exc=exc)


def _render_invoice_pdf(invoice) -> bytes:
    """Render invoice data to PDF bytes using ReportLab."""
    from io import BytesIO

    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas

    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4

    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, height - 60, "VIZTA BOARD — INVOICE")

    c.setFont("Helvetica", 11)
    y = height - 100
    c.drawString(50, y, f"Invoice #: {invoice.invoice_number}")
    y -= 20
    c.drawString(50, y, f"Date: {invoice.created_at.strftime('%Y-%m-%d')}")
    y -= 20
    c.drawString(50, y, f"Advertiser: {invoice.booking.advertiser.full_name}")
    y -= 20
    c.drawString(50, y, f"Billboard: {invoice.booking.billboard.title}")
    y -= 20
    c.drawString(50, y, f"Period: {invoice.booking.start_date} → {invoice.booking.end_date}")
    y -= 30

    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, y, f"Gross Amount:    ₦{invoice.amount_gross:,.2f}")
    y -= 20
    c.drawString(50, y, f"Platform Fee ({invoice.platform_fee_rate}%): ₦{invoice.platform_fee:,.2f}")
    y -= 20
    c.drawString(50, y, f"Net Payout:      ₦{invoice.amount_net:,.2f}")

    c.setFont("Helvetica", 9)
    c.drawString(50, 40, "Vizta Board Ltd  ·  support@viztaboard.com")

    c.showPage()
    c.save()
    return buf.getvalue()
