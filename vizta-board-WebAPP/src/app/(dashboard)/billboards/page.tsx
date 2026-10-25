'use client'

import Link from 'next/link'
import { Plus, RefreshCw } from 'lucide-react'

import { useBillboards } from '@/hooks/use-billboards'
import { formatCurrency, formatDimensions, labelFromEnum } from '@/lib/utils'
import type { Billboard } from '@/types/billboard'

const STATUS_BADGE: Record<Billboard['status'], string> = {
  active:      'badge bg-emerald-100 text-emerald-800',
  inactive:    'badge bg-gray-100 text-gray-600',
  maintenance: 'badge bg-amber-100 text-amber-800',
}

export default function BillboardsPage() {
  const { data, isLoading, isError, refetch } = useBillboards({ page_size: 25 })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billboards</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted-fg)' }}>
            {data?.count ?? 0} listings total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="btn-outline"
            disabled={isLoading}
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link href="/billboards/new" className="btn-primary">
            <Plus className="h-4 w-4" />
            Add Billboard
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--card)' }}>
              {['Name', 'City / Area', 'Type', 'Size', 'Daily Rate', 'Status', ''].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--muted-fg)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    </td>
                  ))}
                </tr>
              ))}

            {isError && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-red-500">
                  Failed to load billboards.{' '}
                  <button onClick={() => refetch()} className="underline">
                    Retry
                  </button>
                </td>
              </tr>
            )}

            {data?.results.map((bb) => (
              <tr key={bb.id} className="hover:bg-[var(--accent-light)] transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium">{bb.name}</div>
                  <div className="text-xs" style={{ color: 'var(--muted-fg)' }}>
                    {bb.address}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {bb.city}
                  {bb.area && <span style={{ color: 'var(--muted-fg)' }}> · {bb.area}</span>}
                </td>
                <td className="px-4 py-3 text-sm">{labelFromEnum(bb.billboard_type)}</td>
                <td className="px-4 py-3 text-sm font-mono">
                  {formatDimensions(bb.width_m, bb.height_m)}
                </td>
                <td className="px-4 py-3 text-sm tabular-nums">
                  {formatCurrency(bb.daily_price)}
                </td>
                <td className="px-4 py-3">
                  <span className={STATUS_BADGE[bb.status]}>{labelFromEnum(bb.status)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/billboards/${bb.id}`}
                    className="text-sm font-medium hover:underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}

            {!isLoading && data?.results.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--muted-fg)' }}>
                  No billboards yet.{' '}
                  <Link href="/billboards/new" className="font-medium underline" style={{ color: 'var(--accent)' }}>
                    Add the first one
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
