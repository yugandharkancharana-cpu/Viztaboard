/**
 * React Query key factory — centralises all cache keys so that invalidation
 * targets the right scope without string-hunting across the codebase.
 *
 * Pattern: [entity, scope?, id?, ...params]
 */

import type { BillboardFilters } from '@/types/billboard'
import type { BookingFilters } from '@/types/booking'
import type { PaginationParams } from '@/types/api'

export const queryKeys = {
  // ── Billboards ─────────────────────────────────────────────────────────────
  billboards: {
    all: ['billboards'] as const,
    lists: () => [...queryKeys.billboards.all, 'list'] as const,
    list: (filters?: BillboardFilters & PaginationParams) =>
      [...queryKeys.billboards.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.billboards.all, 'detail', id] as const,
    availability: (id: string, startDate: string, endDate: string) =>
      [...queryKeys.billboards.all, 'availability', id, { startDate, endDate }] as const,
  },

  // ── Bookings ───────────────────────────────────────────────────────────────
  bookings: {
    all: ['bookings'] as const,
    lists: () => [...queryKeys.bookings.all, 'list'] as const,
    list: (filters?: BookingFilters & PaginationParams) =>
      [...queryKeys.bookings.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.bookings.all, 'detail', id] as const,
  },

  // ── Invoices ───────────────────────────────────────────────────────────────
  invoices: {
    all: ['invoices'] as const,
    detail: (id: string) => [...queryKeys.invoices.all, 'detail', id] as const,
  },

  // ── Settlements ────────────────────────────────────────────────────────────
  settlements: {
    all: ['settlements'] as const,
    lists: () => [...queryKeys.settlements.all, 'list'] as const,
    list: (params?: PaginationParams) =>
      [...queryKeys.settlements.lists(), params] as const,
  },

  // ── Users ──────────────────────────────────────────────────────────────────
  users: {
    all: ['users'] as const,
    me: () => [...queryKeys.users.all, 'me'] as const,
    list: (params?: PaginationParams) =>
      [...queryKeys.users.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.users.all, 'detail', id] as const,
  },

  // ── Analytics ──────────────────────────────────────────────────────────────
  analytics: {
    revenue: (period?: string) => ['analytics', 'revenue', period] as const,
    occupancy: (period?: string) => ['analytics', 'occupancy', period] as const,
  },
} as const
