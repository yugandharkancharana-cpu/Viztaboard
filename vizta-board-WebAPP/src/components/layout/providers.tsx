'use client'

/**
 * Providers — wraps the entire app in:
 *  1. ClerkProvider  — auth context
 *  2. QueryClientProvider — React Query
 *  3. ReactQueryDevtools — only in development
 */

import { ClerkProvider } from '@clerk/nextjs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  // One QueryClient per browser session; stable across re-renders
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache data for 30 s before considering it stale
            staleTime: 30_000,
            // Retry up to 2 times on failure (not 401/403/404)
            retry: (failureCount, error: unknown) => {
              const status = (error as { status?: number }).status
              if (status && [401, 403, 404].includes(status)) return false
              return failureCount < 2
            },
            refetchOnWindowFocus: false,
          },
          mutations: {
            // Surface mutation errors — toasts handled at call site
            throwOnError: false,
          },
        },
      }),
  )

  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
        )}
      </QueryClientProvider>
    </ClerkProvider>
  )
}
