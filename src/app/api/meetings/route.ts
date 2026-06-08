import { auth } from '@/auth'
import sql from '@/lib/db'
import { hasPermission } from '@/lib/auth/rbac'
import { logAudit } from '@/lib/audit'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const offset = (page - 1) * limit

    const role = session.user.role as UserRole
    const canReadAll = hasPermission(role, 'meetings.read.all')
    const userId = session.user.id

    const rows = await sql`
      SELECT
        m.*,
        json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'department', u.department) as host,
        CASE WHEN v.id IS NOT NULL
          THEN json_build_object('id', v.id, 'name', v.name, 'company', v.company)
          ELSE null END as visitor
      FROM meetings m
      LEFT JOIN users u ON m.host_id = u.id
      LEFT JOIN visitors v ON m.visitor_id = v.id
      WHERE
        m.deleted_at IS NULL
        AND (${!canReadAll} = false OR (m.host_id = ${userId} OR m.created_by = ${userId}))
        AND (${status ?? null}::text IS NULL OR m.status = ${status ?? null}::text)
        AND (${search ?? null}::text IS NULL OR m.title ILIKE ${'%' + (search ?? '') + '%'})
      ORDER BY m.scheduled_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const [{ count }] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text as count FROM meetings m
      WHERE
        m.deleted_at IS NULL
        AND (${!canReadAll} = false OR (m.host_id = ${userId} OR m.created_by = ${userId}))
        AND (${status ?? null}::text IS NULL OR m.status = ${status ?? null}::text)
        AND (${search ?? null}::text IS NULL OR m.title ILIKE ${'%' + (search ?? '') + '%'})
    `

    return NextResponse.json({ data: rows, count: parseInt(count), page, limit })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = session.user.role as UserRole
    if (!hasPermission(role, 'meetings.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, host_id, visitor_id, location, scheduled_at, duration_minutes, notes, zoom_link } = body

    if (!title || !host_id || !scheduled_at) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    const [meeting] = await sql`
      INSERT INTO meetings (title, description, host_id, visitor_id, location, scheduled_at, duration_minutes, notes, zoom_link, created_by)
      VALUES (
        ${title}, ${description ?? null}, ${host_id}, ${visitor_id ?? null},
        ${location ?? null}, ${scheduled_at}, ${duration_minutes ?? 60}, ${notes ?? null},
        ${zoom_link ?? null}, ${session.user.id}
      )
      RETURNING *
    `

    await logAudit({
      userId: session.user.id,
      action: 'create',
      resourceType: 'meetings',
      resourceId: meeting.id,
      request,
      newData: meeting as Record<string, unknown>,
    })

    return NextResponse.json({ data: meeting }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
