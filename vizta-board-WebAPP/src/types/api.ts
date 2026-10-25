// Matches Django REST Framework envelope: { data, meta, errors }

export interface ApiResponse<T> {
  data: T
  meta?: {
    count?: number
    page?: number
    page_size?: number
    total_pages?: number
  }
  errors?: ApiError[]
}

export interface ApiError {
  code: string
  detail: string
  attr?: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// Query param helpers
export interface PaginationParams {
  page?: number
  page_size?: number
}

export type SortOrder = 'asc' | 'desc'
