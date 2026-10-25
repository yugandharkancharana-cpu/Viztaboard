export type BillboardType = 'static' | 'digital'
export type BillboardStatus = 'active' | 'inactive' | 'maintenance'
export type PricingModel = 'fixed' | 'dynamic' | 'seasonal' | 'demand' | 'owner_defined'
export type AvailabilityStatus = 'available' | 'booked' | 'blocked' | 'maintenance'

export interface BillboardImage {
  id: string
  billboard_id: string
  url: string             // CloudFront CDN URL resolved by API
  s3_key: string
  sort_order: number
  uploaded_at: string
}

export interface Billboard {
  id: string
  owner_id: string
  name: string
  latitude: number
  longitude: number
  address: string
  city: string
  area: string
  width_m: number
  height_m: number
  billboard_type: BillboardType
  daily_price: string     // Decimal string from DRF
  weekly_price: string
  monthly_price: string
  pricing_model: PricingModel
  traffic_stats: Record<string, unknown> | null
  visibility_rating: number   // 0.0–10.0
  status: BillboardStatus
  images: BillboardImage[]
  created_at: string
  updated_at: string
}

export interface AvailabilityDay {
  date: string            // YYYY-MM-DD
  status: AvailabilityStatus
  booking_id: string | null
}

// For the billboard create/edit form
export interface BillboardFormData {
  name: string
  latitude: number
  longitude: number
  address: string
  city: string
  area: string
  width_m: number
  height_m: number
  billboard_type: BillboardType
  daily_price: number
  weekly_price: number
  monthly_price: number
  pricing_model: PricingModel
  status: BillboardStatus
}

// Filter params for GET /billboards
export interface BillboardFilters {
  city?: string
  area?: string
  billboard_type?: BillboardType
  min_price?: number
  max_price?: number
  start_date?: string
  end_date?: string
  status?: BillboardStatus
  search?: string
}
