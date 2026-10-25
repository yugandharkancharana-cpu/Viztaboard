'use client'

import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

import { useApproveBooking, useBookings, useRejectBooking } from '@/hooks/use-bookings'
import { useToast } from '@/store/app-store'
import { formatCurrency, formatDateRange, labelFromEnum } from '@/lib/utils'
import type { BookingStatus } from '@/types/booking'

const STATUS_BADGE: Record<BookingStatus, string> = {
  pending:    'badge bg-amber-100 text-amber-800',
  approved:   'badge bg-blue-100 text-blue-800',
  active:     'badge bg-emerald-100 text-emerald-800',
  completed:  'badge bg-gray-100 text-gray-600',
  cancelled:  'badge bg-red-100 text-red-700',
  rejected:   'badge bg-red-200 text-red-800',
}

const STATUS_TABS: { label: string; value: BookingStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

export default function BookingsPage() {
  const [tab, setTab] = useState<BookingStatus | 'all'>('all')
  const { add: addToast } = useToast()

  const { data, isLoading } = useBookings(
    tab === 'all' ? undefined : { status: tab },
  )

  const approve = useApproveBooking()
  const reject = useRejectBooking()

  async function handleApprove(id: string) {
    try {
      await approve.mutateAsync(id)
      addToast({ type: 'success', title: 'Booking approved', description: `Booking ${id.slice(0, 8)}… approved.` })
    } catch {
      addToast({ type: 'error', title: 'Approval failed', description: 'Please try again.' })
    }
  }

  async function handleReject(id: string) {
    try {
      await reject.mutateAsync({ id })
      addToast({ type: 'success', title: 'Booking rejected' })
    } catch {
      addToast({ type: 'error', title: 'Rejection failed' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted-fg)' }}>
          Manage and approve booking requests
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: 'var(--border)' }}>
        {STATUS_TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={
              tab === value
                ? 'border-b-2 px-4 py-2 text-sm font-semibold transition-colors'
                : 'px-4 py-2 text-sm transition-colors hover:text-[var(--accent)]'
            }
            style={
              tab === value
                ? { borderColor: 'var(--accent)', color: 'var(--accent)' }
                : { color: 'var(--muted-fg)' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--card)' }}>
              {['Booking ID', 'Billboard', 'Dates', 'Amount', 'Type', 'Status', 'Actions'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--muted-fg)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    </td>
                  ))}
                </tr>
              ))}

            {data?.results.map((booking) => (
              <tr key={booking.id} className="hover:bg-[var(--accent-light)] transition-colors">
                <td className="px-4 py-3 font-mono text-xs">{booking.id.slice(0, 8)}…</td>
                <td className="px-4 py-3 text-sm">{booking.billboard_id.slice(0, 8)}…</td>
                <td className="px-4 py-3 text-sm">
                  {formatDateRange(booking.start_date, booking.end_date)}
                </td>
                <td className="px-4 py-3 text-sm tabular-nums">
                  {formatCurrency(booking.total_amount, booking.currency)}
                </td>
                <td className="px-4 py-3 text-sm">{labelFromEnum(booking.booking_type)}</td>
                <td className="px-4 py-3">
                  <span className={STATUS_BADGE[booking.status]}>
                    {labelFromEnum(booking.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {booking.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(booking.id)}
                        disabled={approve.isPending}
                        className="btn-ghost p-1 text-emerald-600 hover:bg-emerald-50"
                        aria-label="Approve"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleReject(booking.id)}
                        disabled={reject.isPending}
                        className="btn-ghost p-1 text-red-600 hover:bg-red-50"
                        aria-label="Reject"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {!isLoading && data?.results.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm"
                  style={{ color: 'var(--muted-fg)' }}
                >
                  No bookings in this category.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
