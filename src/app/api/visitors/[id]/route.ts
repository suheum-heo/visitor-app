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

    const [visitor] = await sql`
      SELECT v.*,
        json_build_object('id', u1.id, 'name', u1.name, 'email', u1.email, 'department', u1.department) as host,
        json_build_object('id', u2.id, 'name', u2.name) as creator
      FROM visitors v
      LEFT JOIN users u1 ON v.host_id = u1.id
      LEFT JOIN users u2 ON v.created_by = u2.id
      WHERE v.id = ${id}
    `

    if (!visitor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ data: visitor })
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
    const canUpdateAll = hasPermission(role, 'visitors.update.all')
    const canUpdateOwn = hasPermission(role, 'visitors.update.own')
    if (!canUpdateAll && !canUpdateOwn) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [existing] = await sql`SELECT * FROM visitors WHERE id = ${id}`
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!canUpdateAll && existing.host_id !== session.user.id && existing.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json() as Record<string, string | number | boolean | null>
    const allowed = ['name', 'company', 'phone', 'email', 'purpose', 'host_id', 'status', 'scheduled_at', 'arrived_at', 'departed_at', 'notes']
    const updates: Record<string, string | number | boolean | null> = Object.fromEntries(
      Object.entries(body).filter(([k]) => allowed.includes(k))
    )

    const [visitor] = await sql`
      UPDATE visitors SET ${sql(updates)}, updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `

    await sql`
      INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
      VALUES (${session.user.id}, 'update', 'visitors', ${id}, ${JSON.stringify(existing)}, ${JSON.stringify(visitor)})
    `

    return NextResponse.json({ data: visitor })
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
    if (!hasPermission(role, 'visitors.delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [existing] = await sql`SELECT * FROM visitors WHERE id = ${id}`
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await sql`DELETE FROM visitors WHERE id = ${id}`

    await sql`
      INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data)
      VALUES (${session.user.id}, 'delete', 'visitors', ${id}, ${JSON.stringify(existing)})
    `

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
