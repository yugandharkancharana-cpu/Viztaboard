import type { Metadata } from 'next'
import { BookOpen, Building2, DollarSign, TrendingUp } from 'lucide-react'

export const metadata: Metadata = { title: 'Dashboard' }

// Stat card — server component, data fetched from Django API
// Replace with real data via React Query or direct server fetch
const PLACEHOLDER_STATS = [
  {
    label: 'Total Billboards',
    value: '—',
    change: null,
    icon: Building2,
    colour: 'text-brand-600',
    bg: 'bg-brand-50',
  },
  {
    label: 'Active Bookings',
    value: '—',
    change: null,
    icon: BookOpen,
    colour: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    label: 'Revenue (month)',
    value: '—',
    change: null,
    icon: DollarSign,
    colour: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    label: 'Occupancy Rate',
    value: '—',
    change: null,
    icon: TrendingUp,
    colour: 'text-violet-600',
    bg: 'bg-violet-50',
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted-fg)' }}>
          Platform overview — bookings, revenue & occupancy
        </p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PLACEHOLDER_STATS.map(({ label, value, icon: Icon, colour, bg }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`rounded-lg p-3 ${bg}`}>
              <Icon className={`h-6 w-6 ${colour}`} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--muted-fg)' }}>
                {label}
              </p>
              <p className="text-2xl font-bold tabular-nums">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder chart area */}
      <div className="card flex h-64 items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>
          Revenue chart — wire up <code className="font-mono text-xs">GET /analytics/revenue</code>
        </p>
      </div>

      {/* Recent bookings placeholder */}
      <div className="card">
        <h2 className="mb-4 text-base font-semibold">Pending Approvals</h2>
        <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>
          Wire up <code className="font-mono text-xs">GET /bookings?status=pending</code> via{' '}
          <code className="font-mono text-xs">useBookings(&#123; status: &apos;pending&apos; &#125;)</code>
        </p>
      </div>
    </div>
  )
}
