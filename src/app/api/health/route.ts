import sql from '@/lib/db'
import { checkR2Connectivity } from '@/lib/storage/r2'
import { NextResponse } from 'next/server'

export async function GET() {
  const checks: Record<string, { status: 'ok' | 'error'; message?: string }> = {}

  try {
    await sql`SELECT 1 as ok`
    checks.database = { status: 'ok' }
  } catch (err) {
    checks.database = {
      status: 'error',
      message: err instanceof Error ? err.message : 'Database connection failed',
    }
  }

  const r2 = await checkR2Connectivity()
  checks.r2 = r2.ok ? { status: 'ok' } : { status: 'error', message: r2.error }

  const healthy = Object.values(checks).every((c) => c.status === 'ok')

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: healthy ? 200 : 503 }
  )
}
