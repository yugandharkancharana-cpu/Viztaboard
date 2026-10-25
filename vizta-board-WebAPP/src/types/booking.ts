import type { Billboard } from './billboard'
import type { User } from './user'

export type BookingStatus =
  | 'pending'
  | 'approved'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'rejected'

export type BookingType = 'instant' | 'request'

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'void'
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded'
export type SettlementStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Booking {
  id: string
  advertiser_id: string
  advertiser?: User
  billboard_id: string
  billboard?: Billboard
  start_date: string          // YYYY-MM-DD
  end_date: string            // YYYY-MM-DD
  total_amount: string        // Decimal string
  currency: string            // ISO 4217, e.g. 'USD', 'ZAR', 'NGN'
  status: BookingStatus
  booking_type: BookingType
  negotiated_price: string | null
  created_by: string          // User UUID
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  booking_id: string
  booking?: Booking
  invoice_number: string
  subtotal: string
  tax_amount: string
  total: string
  currency: string
  gst_number: string | null
  pdf_url: string | null      // Resolved CloudFront URL
  issued_at: string
  due_at: string
  status: InvoiceStatus
}

export interface Payment {
  id: string
  invoice_id: string
  stripe_payment_intent_id: string
  amount: string
  currency: string
  status: PaymentStatus
  paid_at: string | null
}

export interface Settlement {
  id: string
  owner_id: string
  period_start: string
  period_end: string
  gross_amount: string
  commission_amount: string
  net_payout: string
  status: SettlementStatus
  disbursed_at: string | null
}

// Filter params for GET /bookings
export interface BookingFilters {
  status?: BookingStatus
  billboard_id?: string
  advertiser_id?: string
  start_date?: string
  end_date?: string
}
