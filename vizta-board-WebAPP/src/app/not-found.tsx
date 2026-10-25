import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <p className="text-6xl font-bold" style={{ color: 'var(--accent)' }}>404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className="btn-primary mt-2">
        Back to Dashboard
      </Link>
    </main>
  )
}
