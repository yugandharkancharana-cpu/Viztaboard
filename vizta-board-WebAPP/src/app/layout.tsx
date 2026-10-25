import type { Metadata } from 'next'

import { Providers } from '@/components/layout/providers'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Vizta Board',
    default: 'Vizta Board',
  },
  description: 'Billboard management & booking platform for the African outdoor advertising market.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
