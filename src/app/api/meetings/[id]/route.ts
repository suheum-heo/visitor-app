import { auth } from '@/auth'
import sql from '@/lib/db'
import { hasPermission } from '@/lib/auth/rbac'
import { logAudit } from '@/lib/audit'
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
      WHERE m.id = ${id} AND m.deleted_at IS NULL
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

    const [existing] = await sql`SELECT * FROM meetings WHERE id = ${id} AND deleted_at IS NULL`
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!canUpdateAll && existing.host_id !== session.user.id && existing.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json() as Record<string, string | number | boolean | null>
    const allowed = ['title', 'description', 'host_id', 'visitor_id', 'location', 'scheduled_at', 'duration_minutes', 'status', 'notes', 'zoom_link']
    const updates: Record<string, string | number | boolean | null> = Object.fromEntries(
      Object.entries(body).filter(([k]) => allowed.includes(k))
    )

    const [meeting] = await sql`
      UPDATE meetings SET ${sql(updates)}, updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `

    await logAudit({
      userId: session.user.id,
      action: 'update',
      resourceType: 'meetings',
      resourceId: id,
      request,
      oldData: existing as Record<string, unknown>,
      newData: meeting as Record<string, unknown>,
    })

    return NextResponse.json({ data: meeting })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
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

    const [existing] = await sql`SELECT * FROM meetings WHERE id = ${id} AND deleted_at IS NULL`
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const [deleted] = await sql`
      UPDATE meetings SET deleted_at = now(), updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `

    await logAudit({
      userId: session.user.id,
      action: 'delete',
      resourceType: 'meetings',
      resourceId: id,
      request,
      oldData: existing as Record<string, unknown>,
      newData: deleted as Record<string, unknown>,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
