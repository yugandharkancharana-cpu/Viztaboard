import { clsx, type ClassValue } from 'clsx'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { twMerge } from 'tailwind-merge'

// ── Tailwind class merge helper ───────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Currency formatting ───────────────────────────────────────────────────────
export function formatCurrency(
  amount: string | number,
  currency = 'USD',
  locale = 'en-US',
): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// ── Date formatting ───────────────────────────────────────────────────────────
export function formatDate(dateStr: string, fmt = 'dd MMM yyyy'): string {
  try {
    return format(parseISO(dateStr), fmt)
  } catch {
    return dateStr
  }
}

export function formatRelative(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
  } catch {
    return dateStr
  }
}

// ── Number formatting ─────────────────────────────────────────────────────────
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatCommissionRate(rate: string | number): string {
  const value = typeof rate === 'string' ? parseFloat(rate) : rate
  return formatPercent(value)
}

// ── Billboard dimensions ──────────────────────────────────────────────────────
export function formatDimensions(widthM: number, heightM: number): string {
  return `${widthM}m × ${heightM}m`
}

// ── String helpers ────────────────────────────────────────────────────────────
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

/** Convert snake_case enum values to human-readable labels */
export function labelFromEnum(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Booking date range ────────────────────────────────────────────────────────
export function formatDateRange(startDate: string, endDate: string): string {
  return `${formatDate(startDate)} – ${formatDate(endDate)}`
}

export function bookingDays(startDate: string, endDate: string): number {
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
}
