import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { del, get, getPaginated, patch, post } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { AvailabilityDay, Billboard, BillboardFilters, BillboardFormData } from '@/types/billboard'
import type { PaginationParams, PaginatedResponse } from '@/types/api'

// ── List ──────────────────────────────────────────────────────────────────────
export function useBillboards(filters?: BillboardFilters & PaginationParams) {
  return useQuery({
    queryKey: queryKeys.billboards.list(filters),
    queryFn: () => getPaginated<Billboard>('/billboards', filters as Record<string, unknown>),
    staleTime: 30_000,   // 30 s — billboard list is fairly stable
  })
}

// ── Detail ────────────────────────────────────────────────────────────────────
export function useBillboard(id: string) {
  return useQuery({
    queryKey: queryKeys.billboards.detail(id),
    queryFn: () => get<Billboard>(`/billboards/${id}`),
    enabled: !!id,
  })
}

// ── Availability ──────────────────────────────────────────────────────────────
export function useBillboardAvailability(id: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: queryKeys.billboards.availability(id, startDate, endDate),
    queryFn: () =>
      get<AvailabilityDay[]>(`/billboards/${id}/availability`, { start_date: startDate, end_date: endDate }),
    enabled: !!id && !!startDate && !!endDate,
    staleTime: 60_000,
  })
}

// ── Create ────────────────────────────────────────────────────────────────────
export function useCreateBillboard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: BillboardFormData) => post<Billboard, BillboardFormData>('/billboards', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.billboards.lists() })
    },
  })
}

// ── Update ────────────────────────────────────────────────────────────────────
export function useUpdateBillboard(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<BillboardFormData>) =>
      patch<Billboard, Partial<BillboardFormData>>(`/billboards/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.billboards.detail(id) })
      qc.invalidateQueries({ queryKey: queryKeys.billboards.lists() })
    },
  })
}

// ── Delete (deactivate) ───────────────────────────────────────────────────────
export function useDeleteBillboard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => del<Billboard>(`/billboards/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.billboards.lists() })
    },
  })
}
