/**
 * Vizta Board API client
 *
 * Wraps Axios with:
 *  - Base URL from env
 *  - Clerk JWT attached on every request
 *  - Consistent error unwrapping
 *  - Request/response logging in development
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

import type { ApiResponse, PaginatedResponse } from '@/types/api'

// ── Instance ──────────────────────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15_000,
})

// ── Request interceptor — attach Clerk JWT ────────────────────────────────────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Clerk provides getToken() client-side. Import lazily to avoid SSR issues.
    if (typeof window !== 'undefined') {
      try {
        const { Clerk } = await import('@clerk/nextjs')
        // @ts-expect-error — Clerk window global after load
        const token = await window.Clerk?.session?.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch {
        // Not signed in — public route, carry on
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn(`[API] ${config.method?.toUpperCase()} ${config.url}`)
    }

    return config
  },
  (error) => Promise.reject(error),
)

// ── Response interceptor — unwrap envelope ────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ errors?: { code: string; detail: string }[] }>) => {
    const status = error.response?.status
    const apiErrors = error.response?.data?.errors

    if (status === 401) {
      // Redirect to sign-in — handled by Clerk middleware, but belt-and-suspenders
      if (typeof window !== 'undefined') window.location.href = '/sign-in'
    }

    const message =
      apiErrors?.[0]?.detail ?? error.message ?? 'An unexpected error occurred'

    return Promise.reject(new ApiClientError(message, status, apiErrors))
  },
)

// ── Custom error class ────────────────────────────────────────────────────────
export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly errors?: { code: string; detail: string }[],
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

// ── Typed helpers ─────────────────────────────────────────────────────────────
export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await apiClient.get<ApiResponse<T>>(url, { params })
  return data.data
}

export async function getPaginated<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<PaginatedResponse<T>> {
  const { data } = await apiClient.get<PaginatedResponse<T>>(url, { params })
  return data
}

export async function post<T, B = unknown>(url: string, body?: B): Promise<T> {
  const { data } = await apiClient.post<ApiResponse<T>>(url, body)
  return data.data
}

export async function patch<T, B = unknown>(url: string, body?: B): Promise<T> {
  const { data } = await apiClient.patch<ApiResponse<T>>(url, body)
  return data.data
}

export async function del<T>(url: string): Promise<T> {
  const { data } = await apiClient.delete<ApiResponse<T>>(url)
  return data.data
}
