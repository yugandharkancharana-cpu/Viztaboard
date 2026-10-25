import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Analytics' }

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted-fg)' }}>
          Revenue, occupancy, and campaign performance
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card flex h-64 flex-col">
          <h2 className="mb-2 text-sm font-semibold">Revenue — Monthly Trend</h2>
          <div className="flex flex-1 items-center justify-center rounded-md border border-dashed" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--muted-fg)' }}>
              Wire up <code className="font-mono">GET /analytics/revenue</code>
            </p>
          </div>
        </div>

        <div className="card flex h-64 flex-col">
          <h2 className="mb-2 text-sm font-semibold">Occupancy Rate by City</h2>
          <div className="flex flex-1 items-center justify-center rounded-md border border-dashed" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--muted-fg)' }}>
              Wire up <code className="font-mono">GET /analytics/occupancy</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
