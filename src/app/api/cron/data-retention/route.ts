import sql from '@/lib/db'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return runDataRetention(request)
}

export async function POST(request: NextRequest) {
  return runDataRetention(request)
}

async function runDataRetention(request: NextRequest) {
  try {
    const cronSecret = request.headers.get('x-cron-secret')
    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startedAt = new Date()

    const [{ count: accessDeleted }] = await sql<{ count: string }[]>`
      WITH deleted AS (
        DELETE FROM access_records
        WHERE recorded_at < now() - interval '1 year'
        RETURNING id
      )
      SELECT COUNT(*)::text as count FROM deleted
    `

    const [{ count: auditDeleted }] = await sql<{ count: string }[]>`
      WITH deleted AS (
        DELETE FROM audit_logs
        WHERE created_at < now() - interval '2 years'
        RETURNING id
      )
      SELECT COUNT(*)::text as count FROM deleted
    `

    const [{ count: visitorsDeleted }] = await sql<{ count: string }[]>`
      WITH deleted AS (
        DELETE FROM visitors
        WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '6 months'
        RETURNING id
      )
      SELECT COUNT(*)::text as count FROM deleted
    `

    const [{ count: meetingsDeleted }] = await sql<{ count: string }[]>`
      WITH deleted AS (
        DELETE FROM meetings
        WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '6 months'
        RETURNING id
      )
      SELECT COUNT(*)::text as count FROM deleted
    `

    const summary = {
      access_records_deleted: parseInt(accessDeleted),
      audit_logs_deleted: parseInt(auditDeleted),
      visitors_purged: parseInt(visitorsDeleted),
      meetings_purged: parseInt(meetingsDeleted),
    }

    const totalDeleted =
      summary.access_records_deleted +
      summary.audit_logs_deleted +
      summary.visitors_purged +
      summary.meetings_purged

    const [syncLog] = await sql`
      INSERT INTO sync_logs (
        sync_type, status, records_fetched, records_created, records_updated,
        error_message, started_at, completed_at
      )
      VALUES (
        'data_retention',
        'success',
        0,
        ${totalDeleted},
        0,
        ${JSON.stringify(summary)},
        ${startedAt.toISOString()},
        ${new Date().toISOString()}
      )
      RETURNING *
    `

    return NextResponse.json({ data: syncLog, summary })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'

    try {
      await sql`
        INSERT INTO sync_logs (
          sync_type, status, records_fetched, records_created, records_updated,
          error_message, started_at, completed_at
        )
        VALUES (
          'data_retention',
          'failed',
          0, 0, 0,
          ${message},
          ${new Date().toISOString()},
          ${new Date().toISOString()}
        )
      `
    } catch {
      // ignore secondary logging failure
    }

    return NextResponse.json({ error: 'Data retention failed' }, { status: 500 })
  }
}
