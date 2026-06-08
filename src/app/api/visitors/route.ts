import { auth } from '@/auth'
import sql from '@/lib/db'
import { hasPermission } from '@/lib/auth/rbac'
import { logAudit } from '@/lib/audit'
import { parseTags } from '@/lib/tags'
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
    const canReadAll = hasPermission(role, 'visitors.read.all')
    const userId = session.user.id

    const rows = await sql`
      SELECT
        v.*,
        json_build_object('id', u1.id, 'name', u1.name, 'email', u1.email, 'department', u1.department) as host,
        json_build_object('id', u2.id, 'name', u2.name) as creator
      FROM visitors v
      LEFT JOIN users u1 ON v.host_id = u1.id
      LEFT JOIN users u2 ON v.created_by = u2.id
      WHERE
        v.deleted_at IS NULL
        AND (${!canReadAll} = false OR (v.host_id = ${userId} OR v.created_by = ${userId}))
        AND (${status ?? null}::text IS NULL OR v.status = ${status ?? null}::text)
        AND (
          ${search ?? null}::text IS NULL OR
          v.name ILIKE ${'%' + (search ?? '') + '%'} OR
          v.company ILIKE ${'%' + (search ?? '') + '%'}
        )
      ORDER BY v.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const [{ count }] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text as count FROM visitors v
      WHERE
        v.deleted_at IS NULL
        AND (${!canReadAll} = false OR (v.host_id = ${userId} OR v.created_by = ${userId}))
        AND (${status ?? null}::text IS NULL OR v.status = ${status ?? null}::text)
        AND (
          ${search ?? null}::text IS NULL OR
          v.name ILIKE ${'%' + (search ?? '') + '%'} OR
          v.company ILIKE ${'%' + (search ?? '') + '%'}
        )
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
    if (!hasPermission(role, 'visitors.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, company, phone, email, purpose, host_id, scheduled_at, notes } = body
    const tags = parseTags(body.tags)

    if (!name || !purpose || !host_id) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    const [visitor] = await sql`
      INSERT INTO visitors (name, company, phone, email, purpose, host_id, scheduled_at, notes, tags, created_by)
      VALUES (
        ${name}, ${company ?? null}, ${phone ?? null}, ${email ?? null},
        ${purpose}, ${host_id}, ${scheduled_at ?? null}, ${notes ?? null}, ${tags}, ${session.user.id}
      )
      RETURNING *
    `

    await logAudit({
      userId: session.user.id,
      action: 'create',
      resourceType: 'visitors',
      resourceId: visitor.id,
      request,
      newData: visitor as Record<string, unknown>,
    })

    return NextResponse.json({ data: visitor }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
