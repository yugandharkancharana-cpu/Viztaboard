/**
 * Vizta Board API service
 * Base URL: https://api.viztaboard.com/api/v1  (core-api — Django 5 + DRF)
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { ApiError, PaginatedResponse } from '../types';

const BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ?? 'https://api.viztaboard.com/api/v1';

// ── Axios instance ────────────────────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL:        BASE_URL,
  timeout:        15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept:         'application/json',
  },
});

// ── Auth token injection ──────────────────────────────────────────────────────

let _authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  _authToken = token;
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
}

// ── Response interceptor (normalise errors) ───────────────────────────────────

apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiError>) => {
    const msg =
      error.response?.data?.detail ??
      error.response?.data?.message ??
      error.message ??
      'An unexpected error occurred.';
    return Promise.reject(new Error(msg));
  }
);

// ── Generic request helpers ───────────────────────────────────────────────────

async function get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await apiClient.get<T>(path, config);
  return data;
}

async function post<T>(path: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await apiClient.post<T>(path, body, config);
  return data;
}

async function patch<T>(path: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await apiClient.patch<T>(path, body, config);
  return data;
}

async function del<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await apiClient.delete<T>(path, config);
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth endpoints
// ─────────────────────────────────────────────────────────────────────────────

export const AuthAPI = {
  /** Exchange Clerk session token for a platform JWT */
  clerkSync: (clerkToken: string) =>
    post<{ access: string; user: import('../types').User }>('/auth/clerk-sync/', {
      clerk_token: clerkToken,
    }),

  /** Refresh platform JWT */
  refreshToken: (refresh: string) =>
    post<{ access: string }>('/auth/token/refresh/', { refresh }),

  /** Fetch current user profile */
  me: () => get<import('../types').User>('/auth/me/'),
};

// ─────────────────────────────────────────────────────────────────────────────
// Billboard endpoints
// ─────────────────────────────────────────────────────────────────────────────

export const BillboardAPI = {
  list: (params?: {
    city?: string;
    format?: string;
    min_rate?: number;
    max_rate?: number;
    illuminated?: boolean;
    digital?: boolean;
    page?: number;
    page_size?: number;
    search?: string;
  }) =>
    get<PaginatedResponse<import('../types').Billboard>>('/billboards/', { params }),

  detail: (id: string) =>
    get<import('../types').Billboard>(`/billboards/${id}/`),

  checkAvailability: (id: string, startDate: string, endDate: string) =>
    get<{ available: boolean; conflicts: string[] }>(
      `/billboards/${id}/availability/`,
      { params: { start_date: startDate, end_date: endDate } }
    ),

  featured: () =>
    get<import('../types').Billboard[]>('/billboards/featured/'),
};

// ─────────────────────────────────────────────────────────────────────────────
// Booking endpoints
// ─────────────────────────────────────────────────────────────────────────────

export const BookingAPI = {
  list: (params?: { status?: string; page?: number }) =>
    get<PaginatedResponse<import('../types').Booking>>('/bookings/', { params }),

  create: (payload: {
    billboard_id:  string;
    booking_type:  'instant' | 'request';
    start_date:    string;
    end_date:      string;
    notes?:        string;
  }) =>
    post<import('../types').Booking>('/bookings/', payload),

  detail: (id: string) =>
    get<import('../types').Booking>(`/bookings/${id}/`),

  cancel: (id: string) =>
    post<import('../types').Booking>(`/bookings/${id}/cancel/`),

  uploadArtwork: (id: string, formData: FormData) =>
    post<import('../types').Booking>(`/bookings/${id}/artwork/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** Owner-only: approve or reject a booking request */
  review: (id: string, action: 'approve' | 'reject', rejectionReason?: string) =>
    post<import('../types').Booking>(`/bookings/${id}/review/`, {
      action,
      rejection_reason: rejectionReason,
    }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Campaign endpoints
// ─────────────────────────────────────────────────────────────────────────────

export const CampaignAPI = {
  list: (params?: { status?: string; page?: number }) =>
    get<PaginatedResponse<import('../types').Campaign>>('/campaigns/', { params }),

  create: (payload: {
    name:        string;
    description?: string;
    budget_usd:  number;
    start_date:  string;
    end_date:    string;
  }) =>
    post<import('../types').Campaign>('/campaigns/', payload),

  detail: (id: string) =>
    get<import('../types').Campaign>(`/campaigns/${id}/`),

  addBooking: (campaignId: string, bookingId: string) =>
    post(`/campaigns/${campaignId}/bookings/`, { booking_id: bookingId }),

  analytics: (id: string, from: string, to: string) =>
    get<{
      impressions:    number[];
      reach:          number[];
      dates:          string[];
      totalImpressions:number;
      avgDailyReach:  number;
    }>(`/campaigns/${id}/analytics/`, { params: { from, to } }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Payment endpoints
// ─────────────────────────────────────────────────────────────────────────────

export const PaymentAPI = {
  createIntent: (bookingId: string) =>
    post<{ clientSecret: string; paymentIntentId: string }>(
      '/payments/intent/',
      { booking_id: bookingId }
    ),

  history: (params?: { page?: number }) =>
    get<PaginatedResponse<import('../types').Payment>>('/payments/', { params }),

  detail: (id: string) =>
    get<import('../types').Payment>(`/payments/${id}/`),
};

// ─────────────────────────────────────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────────────────────────────────────

export const NotificationAPI = {
  list: (params?: { unread?: boolean; page?: number }) =>
    get<PaginatedResponse<import('../types').Notification>>(
      '/notifications/',
      { params }
    ),

  markRead: (id: string) =>
    patch<import('../types').Notification>(`/notifications/${id}/`, { is_read: true }),

  markAllRead: () =>
    post('/notifications/mark-all-read/'),

  registerPushToken: (token: string, platform: 'ios' | 'android') =>
    post('/notifications/push-token/', { token, platform }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Owner endpoints
// ─────────────────────────────────────────────────────────────────────────────

export const OwnerAPI = {
  dashboard: () =>
    get<{
      totalBillboards:  number;
      activeBillboards: number;
      pendingBookings:  number;
      thisMonthRevenue: number;
      occupancyRate:    number;
    }>('/owner/dashboard/'),

  earnings: (year: number, month: number) =>
    get<import('../types').OwnerEarnings>('/owner/earnings/', {
      params: { year, month },
    }),

  billboards: (params?: { status?: string; page?: number }) =>
    get<PaginatedResponse<import('../types').Billboard>>('/owner/billboards/', { params }),

  pendingBookings: () =>
    get<import('../types').Booking[]>('/owner/bookings/pending/'),
};

export default apiClient;
