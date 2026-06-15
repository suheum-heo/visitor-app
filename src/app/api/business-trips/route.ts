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
    const canReadAll = hasPermission(role, 'trips.read.all')
    const userId = session.user.id

    const rows = await sql`
      SELECT
        bt.*,
        json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'department', u.department) as employee,
        CASE WHEN p.id IS NOT NULL
          THEN json_build_object('id', p.id, 'name', p.name, 'company', p.company)
          ELSE null END as project
      FROM business_trips bt
      LEFT JOIN users u ON bt.employee_id = u.id
      LEFT JOIN projects p ON bt.project_id = p.id
      WHERE
        bt.deleted_at IS NULL
        AND (${!canReadAll} = false OR (bt.employee_id = ${userId} OR bt.created_by = ${userId}))
        AND (${status ?? null}::text IS NULL OR bt.status = ${status ?? null}::text)
        AND (
          ${search ?? null}::text IS NULL OR
          bt.title ILIKE ${'%' + (search ?? '') + '%'} OR
          bt.company ILIKE ${'%' + (search ?? '') + '%'} OR
          bt.location ILIKE ${'%' + (search ?? '') + '%'}
        )
      ORDER BY bt.scheduled_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const [{ count }] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text as count FROM business_trips bt
      WHERE
        bt.deleted_at IS NULL
        AND (${!canReadAll} = false OR (bt.employee_id = ${userId} OR bt.created_by = ${userId}))
        AND (${status ?? null}::text IS NULL OR bt.status = ${status ?? null}::text)
        AND (
          ${search ?? null}::text IS NULL OR
          bt.title ILIKE ${'%' + (search ?? '') + '%'} OR
          bt.company ILIKE ${'%' + (search ?? '') + '%'} OR
          bt.location ILIKE ${'%' + (search ?? '') + '%'}
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
    if (!hasPermission(role, 'trips.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title, employee_id, company, location, project_id,
      purpose, scheduled_at, end_at, notes,
    } = body
    const tags = parseTags(body.tags)

    if (!title || !employee_id || !scheduled_at) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    const [trip] = await sql`
      INSERT INTO business_trips (
        title, employee_id, company, location, project_id,
        purpose, scheduled_at, end_at, notes, tags, created_by
      )
      VALUES (
        ${title}, ${employee_id}, ${company ?? null}, ${location ?? null},
        ${project_id ?? null}, ${purpose ?? null}, ${scheduled_at},
        ${end_at ?? null}, ${notes ?? null}, ${tags}, ${session.user.id}
      )
      RETURNING *
    `

    await logAudit({
      userId: session.user.id,
      action: 'create',
      resourceType: 'business_trips',
      resourceId: trip.id,
      request,
      newData: trip as Record<string, unknown>,
    })

    return NextResponse.json({ data: trip }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
