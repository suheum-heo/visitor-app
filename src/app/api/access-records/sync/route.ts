import { auth } from '@/auth'
import sql from '@/lib/db'
import { hasPermission } from '@/lib/auth/rbac'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const cronSecret = request.headers.get('x-cron-secret')
    const isCron = cronSecret && cronSecret === process.env.CRON_SECRET

    let userId: string | null = null

    if (!isCron) {
      const session = await auth()
      if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const role = session.user.role as UserRole
      if (!hasPermission(role, 'access.sync')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      userId = session.user.id
    }

    const startedAt = new Date()

    // Stub: external security system API not yet connected
    const [syncLog] = await sql`
      INSERT INTO sync_logs (
        sync_type, status, records_fetched, records_created, records_updated,
        error_message, started_at, completed_at
      )
      VALUES (
        'access_records',
        'success',
        0, 0, 0,
        'Stub sync — external API not configured',
        ${startedAt.toISOString()},
        ${new Date().toISOString()}
      )
      RETURNING *
    `

    if (userId) {
      await sql`
        INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data)
        VALUES (${userId}, 'sync', 'sync_logs', ${syncLog.id}, ${JSON.stringify(syncLog)})
      `
    }

    return NextResponse.json({
      data: syncLog,
      message: 'Sync stub completed — no records fetched from external system',
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
