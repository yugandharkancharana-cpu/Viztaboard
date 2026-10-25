import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { get, getPaginated, patch } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { Booking, BookingFilters, Invoice, Settlement } from '@/types/booking'
import type { PaginationParams } from '@/types/api'

// ── List bookings ─────────────────────────────────────────────────────────────
export function useBookings(filters?: BookingFilters & PaginationParams) {
  return useQuery({
    queryKey: queryKeys.bookings.list(filters),
    queryFn: () => getPaginated<Booking>('/bookings', filters as Record<string, unknown>),
    staleTime: 15_000,
  })
}

// ── Booking detail ────────────────────────────────────────────────────────────
export function useBooking(id: string) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => get<Booking>(`/bookings/${id}`),
    enabled: !!id,
  })
}

// ── Admin: approve ────────────────────────────────────────────────────────────
export function useApproveBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => patch<Booking>(`/bookings/${id}/approve`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) })
      qc.invalidateQueries({ queryKey: queryKeys.bookings.lists() })
    },
  })
}

// ── Admin: reject ─────────────────────────────────────────────────────────────
export function useRejectBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      patch<Booking>(`/bookings/${id}/reject`, { reason }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) })
      qc.invalidateQueries({ queryKey: queryKeys.bookings.lists() })
    },
  })
}

// ── Cancel ────────────────────────────────────────────────────────────────────
export function useCancelBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => patch<Booking>(`/bookings/${id}/cancel`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) })
      qc.invalidateQueries({ queryKey: queryKeys.bookings.lists() })
    },
  })
}

// ── Invoices ──────────────────────────────────────────────────────────────────
export function useInvoice(id: string) {
  return useQuery({
    queryKey: queryKeys.invoices.detail(id),
    queryFn: () => get<Invoice>(`/invoices/${id}`),
    enabled: !!id,
  })
}

// ── Settlements ───────────────────────────────────────────────────────────────
export function useSettlements(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.settlements.list(params),
    queryFn: () => getPaginated<Settlement>('/settlements', params as Record<string, unknown>),
    staleTime: 60_000,
  })
}

export function useDisburseSettlement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => patch<Settlement>(`/settlements/${id}/disburse`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.settlements.lists() })
    },
  })
}
