'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart3,
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  LayoutDashboard,
  Receipt,
  Settings,
  Users,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useSidebar } from '@/store/app-store'

const NAV_ITEMS = [
  { href: '/',            label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/billboards',  label: 'Billboards',  icon: Building2 },
  { href: '/bookings',    label: 'Bookings',    icon: BookOpen },
  { href: '/finance/invoices',   label: 'Invoices',    icon: Receipt },
  { href: '/finance/settlements', label: 'Settlements', icon: DollarSign },
  { href: '/analytics',  label: 'Analytics',   icon: BarChart3 },
  { href: '/users',       label: 'Users',       icon: Users },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const { collapsed, toggle } = useSidebar()

  return (
    <aside
      style={{ width: collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)' }}
      className="relative flex h-screen flex-col bg-brand-800 transition-[width] duration-200"
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-500">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-base font-bold tracking-tight text-white">
            Vizta Board
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              href === '/' ? pathname === '/' : pathname.startsWith(href)

            return (
              <li key={href}>
                <Link
                  href={href}
                  title={collapsed ? label : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-brand-600 text-white'
                      : 'text-brand-200 hover:bg-brand-700 hover:text-white',
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Settings + collapse */}
      <div className="border-t border-brand-700 px-2 py-4 space-y-1">
        <Link
          href="/settings"
          title={collapsed ? 'Settings' : undefined}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-brand-200 hover:bg-brand-700 hover:text-white transition-colors"
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>

        <button
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-brand-300 hover:bg-brand-700 hover:text-white transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
