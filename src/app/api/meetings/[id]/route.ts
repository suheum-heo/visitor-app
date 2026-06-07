import { auth } from '@/auth'
import sql from '@/lib/db'
import { hasPermission } from '@/lib/auth/rbac'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/types'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [meeting] = await sql`
      SELECT m.*,
        json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'department', u.department) as host,
        CASE WHEN v.id IS NOT NULL
          THEN json_build_object('id', v.id, 'name', v.name, 'company', v.company)
          ELSE null END as visitor
      FROM meetings m
      LEFT JOIN users u ON m.host_id = u.id
      LEFT JOIN visitors v ON m.visitor_id = v.id
      WHERE m.id = ${id}
    `

    if (!meeting) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ data: meeting })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = session.user.role as UserRole
    const canUpdateAll = hasPermission(role, 'meetings.update.all')
    const canUpdateOwn = hasPermission(role, 'meetings.update.own')
    if (!canUpdateAll && !canUpdateOwn) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [existing] = await sql`SELECT * FROM meetings WHERE id = ${id}`
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!canUpdateAll && existing.host_id !== session.user.id && existing.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json() as Record<string, string | number | boolean | null>
    const allowed = ['title', 'description', 'host_id', 'visitor_id', 'location', 'scheduled_at', 'duration_minutes', 'status', 'notes']
    const updates: Record<string, string | number | boolean | null> = Object.fromEntries(
      Object.entries(body).filter(([k]) => allowed.includes(k))
    )

    const [meeting] = await sql`
      UPDATE meetings SET ${sql(updates)}, updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `

    await sql`
      INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
      VALUES (${session.user.id}, 'update', 'meetings', ${id}, ${JSON.stringify(existing)}, ${JSON.stringify(meeting)})
    `

    return NextResponse.json({ data: meeting })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = session.user.role as UserRole
    if (!hasPermission(role, 'meetings.delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [existing] = await sql`SELECT * FROM meetings WHERE id = ${id}`
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await sql`DELETE FROM meetings WHERE id = ${id}`

    await sql`
      INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data)
      VALUES (${session.user.id}, 'delete', 'meetings', ${id}, ${JSON.stringify(existing)})
    `

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
