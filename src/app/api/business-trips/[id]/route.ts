import { auth } from '@/auth'
import sql from '@/lib/db'
import { hasPermission } from '@/lib/auth/rbac'
import { logAudit } from '@/lib/audit'
import { parseTimestampInput } from '@/lib/datetime-local'
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

    const [trip] = await sql`
      SELECT bt.*,
        json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'department', u.department) as employee,
        CASE WHEN p.id IS NOT NULL
          THEN json_build_object('id', p.id, 'name', p.name, 'company', p.company)
          ELSE null END as project
      FROM business_trips bt
      LEFT JOIN users u ON bt.employee_id = u.id
      LEFT JOIN projects p ON bt.project_id = p.id
      WHERE bt.id = ${id} AND bt.deleted_at IS NULL
    `

    if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const role = session.user.role as UserRole
    const canReadAll = hasPermission(role, 'trips.read.all')
    if (!canReadAll && trip.employee_id !== session.user.id && trip.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ data: trip })
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
    const canUpdateAll = hasPermission(role, 'trips.update.all')
    const canUpdateOwn = hasPermission(role, 'trips.update.own')
    if (!canUpdateAll && !canUpdateOwn) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [existing] = await sql`SELECT * FROM business_trips WHERE id = ${id} AND deleted_at IS NULL`
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!canUpdateAll && existing.employee_id !== session.user.id && existing.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json() as Record<string, string | number | boolean | null>
    const allowed = [
      'title', 'employee_id', 'company', 'location', 'project_id',
      'purpose', 'scheduled_at', 'end_at', 'status', 'notes', 'tags',
    ]
    const updates: Record<string, string | number | boolean | string[] | null> = Object.fromEntries(
      Object.entries(body).filter(([k]) => allowed.includes(k))
    )
    if ('tags' in updates) {
      const { parseTags } = await import('@/lib/tags')
      updates.tags = parseTags(body.tags)
    }
    if ('project_id' in updates && updates.project_id === '') {
      updates.project_id = null
    }
    if ('scheduled_at' in updates) {
      const parsed = parseTimestampInput(updates.scheduled_at)
      if (!parsed) {
        return NextResponse.json({ error: '출발 일시 형식이 올바르지 않습니다.' }, { status: 400 })
      }
      updates.scheduled_at = parsed
    }
    if ('end_at' in updates) {
      updates.end_at = parseTimestampInput(updates.end_at)
    }

    const [trip] = await sql`
      UPDATE business_trips SET ${sql(updates)}, updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `

    await logAudit({
      userId: session.user.id,
      action: 'update',
      resourceType: 'business_trips',
      resourceId: id,
      request,
      oldData: existing as Record<string, unknown>,
      newData: trip as Record<string, unknown>,
    })

    return NextResponse.json({ data: trip })
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
    if (!hasPermission(role, 'trips.delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [existing] = await sql`SELECT * FROM business_trips WHERE id = ${id} AND deleted_at IS NULL`
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const [deleted] = await sql`
      UPDATE business_trips SET deleted_at = now(), updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `

    await logAudit({
      userId: session.user.id,
      action: 'delete',
      resourceType: 'business_trips',
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
