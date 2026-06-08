import { auth } from '@/auth'
import sql from '@/lib/db'
import { hasPermission } from '@/lib/auth/rbac'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = session.user.role as UserRole
    if (!hasPermission(role, 'access.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const direction = searchParams.get('direction')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const offset = (page - 1) * limit

    const rows = await sql`
      SELECT ar.*,
        CASE WHEN v.id IS NOT NULL
          THEN json_build_object('id', v.id, 'name', v.name, 'company', v.company)
          ELSE null END as visitor
      FROM access_records ar
      LEFT JOIN visitors v ON ar.visitor_id = v.id
      WHERE
        (${direction ?? null}::text IS NULL OR ar.direction = ${direction ?? null}::text)
        AND (${dateFrom ?? null}::timestamptz IS NULL OR ar.recorded_at >= ${dateFrom ?? null}::timestamptz)
        AND (${dateTo ?? null}::timestamptz IS NULL OR ar.recorded_at <= ${dateTo ?? null}::timestamptz)
        AND (
          ${search ?? null}::text IS NULL OR
          ar.name ILIKE ${'%' + (search ?? '') + '%'} OR
          ar.company ILIKE ${'%' + (search ?? '') + '%'}
        )
      ORDER BY ar.recorded_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const [{ count }] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text as count FROM access_records ar
      WHERE
        (${direction ?? null}::text IS NULL OR ar.direction = ${direction ?? null}::text)
        AND (${dateFrom ?? null}::timestamptz IS NULL OR ar.recorded_at >= ${dateFrom ?? null}::timestamptz)
        AND (${dateTo ?? null}::timestamptz IS NULL OR ar.recorded_at <= ${dateTo ?? null}::timestamptz)
        AND (
          ${search ?? null}::text IS NULL OR
          ar.name ILIKE ${'%' + (search ?? '') + '%'} OR
          ar.company ILIKE ${'%' + (search ?? '') + '%'}
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
    if (!hasPermission(role, 'access.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, company, direction, access_point, recorded_at, visitor_id, notes } = body

    if (!name || !direction || !['in', 'out'].includes(direction)) {
      return NextResponse.json({ error: '이름과 입퇴장 방향은 필수입니다.' }, { status: 400 })
    }

    const [record] = await sql`
      INSERT INTO access_records (
        name, company, direction, access_point, recorded_at,
        visitor_id, notes, source, created_by
      )
      VALUES (
        ${name},
        ${company ?? null},
        ${direction},
        ${access_point ?? null},
        ${recorded_at ?? new Date().toISOString()},
        ${visitor_id ?? null},
        ${notes ?? null},
        'manual',
        ${session.user.id}
      )
      RETURNING *
    `

    await sql`
      INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data)
      VALUES (${session.user.id}, 'create', 'access_records', ${record.id}, ${JSON.stringify(record)})
    `

    return NextResponse.json({ data: record }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
