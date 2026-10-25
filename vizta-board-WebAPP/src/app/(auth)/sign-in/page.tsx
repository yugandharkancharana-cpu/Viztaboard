import { SignIn } from '@clerk/nextjs'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Sign In' }

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <div className="w-full max-w-md space-y-6 px-4">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-800">
            <span className="text-2xl font-bold text-white">V</span>
          </div>
          <h2 className="text-xl font-bold">Vizta Board Admin</h2>
          <p className="mt-1 text-sm text-[var(--muted-fg)]">
            Sign in to manage billboard inventory and bookings
          </p>
        </div>

        {/* Clerk hosted sign-in component */}
        <SignIn
          appearance={{
            elements: {
              card: 'shadow-md border border-[var(--border)] rounded-lg',
              primaryButton: 'btn-primary',
            },
          }}
        />
      </div>
    </main>
  )
}
