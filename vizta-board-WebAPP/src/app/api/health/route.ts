import { NextResponse } from 'next/server'

// GET /api/health — used by load balancer health checks
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'vizta-board-web' })
}
