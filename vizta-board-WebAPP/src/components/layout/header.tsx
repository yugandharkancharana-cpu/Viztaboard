'use client'

import { UserButton } from '@clerk/nextjs'
import { Bell } from 'lucide-react'

import { cn } from '@/lib/utils'

interface HeaderProps {
  title?: string
  className?: string
}

export function Header({ title, className }: HeaderProps) {
  return (
    <header
      className={cn(
        'flex h-16 items-center justify-between border-b px-6',
        className,
      )}
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      {/* Page title */}
      {title && (
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      )}

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-4">
        {/* Notification bell — wire up notification count here */}
        <button
          aria-label="Notifications"
          className="relative rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Bell className="h-5 w-5" />
          {/* Unread badge — conditionally render */}
          {/* <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" /> */}
        </button>

        {/* Clerk avatar + user menu */}
        <UserButton
          afterSignOutUrl="/sign-in"
          appearance={{
            elements: {
              avatarBox: 'h-8 w-8',
            },
          }}
        />
      </div>
    </header>
  )
}
