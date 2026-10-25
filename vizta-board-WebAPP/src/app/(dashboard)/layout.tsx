import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Server-side auth guard — unauthenticated users land on sign-in
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main
          className="flex-1 overflow-y-auto p-6"
          style={{ backgroundColor: 'var(--bg)' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
