export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'billboard_owner'
  | 'advertiser'
  | 'sales_exec'
  | 'finance'
  | 'operations'

export interface User {
  id: string               // UUID
  clerk_id: string
  email: string
  full_name: string
  phone: string | null
  role: UserRole
  is_active: boolean
  created_at: string       // ISO 8601
  updated_at: string
}

export interface BillboardOwner {
  id: string
  user: User
  company_name: string | null
  commission_rate: number  // e.g. 0.12 = 12%
  onboarded_at: string
}

// What Clerk returns for the current session user
export interface AuthUser {
  id: string               // clerk_id
  email: string
  firstName: string | null
  lastName: string | null
  imageUrl: string
  // Vizta metadata stored in Clerk public metadata
  metadata: {
    role: UserRole
    vb_user_id: string
  }
}

// RBAC helper — roles that can access the admin web app
export const ADMIN_ROLES: UserRole[] = [
  'super_admin',
  'admin',
  'billboard_owner',
  'sales_exec',
  'finance',
  'operations',
]
