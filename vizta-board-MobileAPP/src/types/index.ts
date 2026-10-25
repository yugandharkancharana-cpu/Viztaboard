/**
 * Vizta Board — Shared TypeScript types
 * Mirrors the DB schema defined in ViztraBoard_TechSpec_v1.0
 */

// ── Auth & Users ──────────────────────────────────────────────────────────────

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'billboard_owner'
  | 'advertiser'
  | 'sales_executive'
  | 'finance_team'
  | 'operations_team';

export interface User {
  id:           string;
  clerkUserId:  string;
  email:        string;
  firstName:    string;
  lastName:     string;
  phone?:       string;
  role:         UserRole;
  isActive:     boolean;
  createdAt:    string;
  updatedAt:    string;
}

export interface AuthSession {
  user:         User;
  accessToken:  string;
}

// ── Billboards ────────────────────────────────────────────────────────────────

export type BillboardFormat =
  | 'billboard'
  | 'gantry'
  | 'lamp_post'
  | 'rooftop'
  | 'digital_led'
  | 'transit_shelter'
  | 'wall_mural';

export type BillboardStatus =
  | 'active'
  | 'inactive'
  | 'maintenance'
  | 'pending_review';

export interface Location {
  id:          string;
  country:     string;
  state:       string;
  city:        string;
  area:        string;
  latitude:    number;
  longitude:   number;
  landmark?:   string;
}

export interface Billboard {
  id:              string;
  ownerId:         string;
  title:           string;
  description?:    string;
  format:          BillboardFormat;
  status:          BillboardStatus;
  widthFt:         number;
  heightFt:        number;
  facingDirection: string;
  illuminated:     boolean;
  digital:         boolean;
  dailyRateUsd:    number;
  minBookingDays:  number;
  location:        Location;
  photoUrls:       string[];
  trafficStats: {
    dailyImpressionsAvg?: number;
    weeklyReach?:         number;
    demographicNotes?:    string;
  };
  availableFrom?:  string;
  availableTo?:    string;
  isFeatured:      boolean;
  createdAt:       string;
}

// ── Bookings ──────────────────────────────────────────────────────────────────

export type BookingType   = 'instant' | 'request';
export type BookingStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'completed'
  | 'cancelled';

export interface Booking {
  id:              string;
  advertiserId:    string;
  billboardId:     string;
  billboard?:      Billboard;
  bookingType:     BookingType;
  status:          BookingStatus;
  startDate:       string;
  endDate:         string;
  totalDays:       number;
  ratePerDay:      number;
  subtotalUsd:     number;
  platformFeeUsd:  number;
  totalAmountUsd:  number;
  artworkUrl?:     string;
  notes?:          string;
  rejectionReason?: string;
  createdAt:       string;
  updatedAt:       string;
}

// ── Campaigns ─────────────────────────────────────────────────────────────────

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface Campaign {
  id:          string;
  advertiserId:string;
  name:        string;
  description?: string;
  status:      CampaignStatus;
  budgetUsd:   number;
  spentUsd:    number;
  startDate:   string;
  endDate:     string;
  bookings:    Booking[];
  createdAt:   string;
  updatedAt:   string;
}

// ── Payments ──────────────────────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';

export interface Payment {
  id:                  string;
  bookingId:           string;
  advertiserId:        string;
  amountUsd:           number;
  currency:            string;
  status:              PaymentStatus;
  stripePaymentIntentId?: string;
  paymentMethodType?:  string;
  paidAt?:             string;
  createdAt:           string;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export type NotificationType =
  | 'booking_confirmed'
  | 'booking_approved'
  | 'booking_rejected'
  | 'payment_received'
  | 'campaign_started'
  | 'campaign_ended'
  | 'artwork_required'
  | 'system_alert';

export interface Notification {
  id:          string;
  userId:      string;
  type:        NotificationType;
  title:       string;
  body:        string;
  isRead:      boolean;
  metadata?:   Record<string, unknown>;
  createdAt:   string;
}

// ── Owner-specific ────────────────────────────────────────────────────────────

export interface BillboardOwner {
  id:             string;
  userId:         string;
  user?:          User;
  businessName:   string;
  commissionRate: number;   // e.g. 0.15 for 15%
  bankName?:      string;
  accountNumber?: string;
  isVerified:     boolean;
  totalBillboards:number;
  createdAt:      string;
}

export interface OwnerEarnings {
  periodLabel:       string;   // e.g. "October 2026"
  grossRevenue:      number;
  platformCommission:number;
  netEarnings:       number;
  pendingSettlement: number;
  paidOut:           number;
}

// ── Pagination & API responses ────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count:     number;
  next?:     string | null;
  previous?: string | null;
  results:   T[];
}

export interface ApiError {
  detail?: string;
  message?: string;
  errors?:  Record<string, string[]>;
}

// ── Navigation param lists ────────────────────────────────────────────────────

export type RootStackParamList = {
  Splash:  undefined;
  Auth:    undefined;
  Advertiser: undefined;
  Owner:   undefined;
};

export type AuthStackParamList = {
  Login:    undefined;
  Register: undefined;
};

export type AdvertiserTabParamList = {
  Browse:       undefined;
  Campaigns:    undefined;
  Notifications:undefined;
  Profile:      undefined;
};

export type AdvertiserStackParamList = {
  BrowseTab:       undefined;
  BillboardDetail: { billboardId: string };
  Booking:         { billboardId: string };
  Payment:         { bookingId: string };
  CampaignDetail:  { campaignId: string };
};

export type OwnerTabParamList = {
  Dashboard:     undefined;
  Notifications: undefined;
  Profile:       undefined;
};
