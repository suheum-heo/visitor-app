import { auth } from '@/auth'
import sql from '@/lib/db'
import { hasPermission } from '@/lib/auth/rbac'
import { parseTagsParam } from '@/lib/tags'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/types'

type SearchType = 'visitor' | 'meeting' | 'all'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() ?? ''
    const type = (searchParams.get('type') ?? 'all') as SearchType
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const tags = parseTagsParam(searchParams.get('tags'))

    if (!q && tags.length === 0) {
      return NextResponse.json({ data: { visitors: [], meetings: [] }, query: q, tags })
    }

    const role = session.user.role as UserRole
    const userId = session.user.id
    const canReadAllVisitors = hasPermission(role, 'visitors.read.all')
    const canReadAllMeetings = hasPermission(role, 'meetings.read.all')
    const hasTextQuery = q.length > 0
    const hasTagFilter = tags.length > 0

    const visitors =
      type === 'meeting'
        ? []
        : await sql`
            SELECT
              v.id, v.name, v.company, v.email, v.phone, v.status,
              v.scheduled_at, v.created_at, v.tags,
              ts_rank(
                to_tsvector('simple',
                  coalesce(v.name, '') || ' ' ||
                  coalesce(v.company, '') || ' ' ||
                  coalesce(v.email, '') || ' ' ||
                  coalesce(v.phone, '') || ' ' ||
                  coalesce(v.notes, '') || ' ' ||
                  coalesce(array_to_string(v.tags, ' '), '')
                ),
                plainto_tsquery('simple', ${q})
              ) as rank
            FROM visitors v
            WHERE
              v.deleted_at IS NULL
              AND (${!canReadAllVisitors} = false OR (v.host_id = ${userId} OR v.created_by = ${userId}))
              AND (${dateFrom ?? null}::timestamptz IS NULL OR v.scheduled_at >= ${dateFrom ?? null}::timestamptz)
              AND (${dateTo ?? null}::timestamptz IS NULL OR v.scheduled_at <= ${dateTo ?? null}::timestamptz)
              AND (${!hasTagFilter} OR v.tags && ${tags}::text[])
              AND (
                ${!hasTextQuery} OR
                to_tsvector('simple',
                  coalesce(v.name, '') || ' ' ||
                  coalesce(v.company, '') || ' ' ||
                  coalesce(v.email, '') || ' ' ||
                  coalesce(v.phone, '') || ' ' ||
                  coalesce(v.notes, '') || ' ' ||
                  coalesce(array_to_string(v.tags, ' '), '')
                ) @@ plainto_tsquery('simple', ${q})
              )
            ORDER BY rank DESC NULLS LAST, v.created_at DESC
            LIMIT 20
          `

    const meetings =
      type === 'visitor'
        ? []
        : await sql`
            SELECT
              m.id, m.title, m.description, m.location, m.status,
              m.scheduled_at, m.created_at, m.tags,
              json_build_object('id', v.id, 'name', v.name, 'company', v.company) as visitor,
              ts_rank(
                to_tsvector('simple',
                  coalesce(m.title, '') || ' ' ||
                  coalesce(m.description, '') || ' ' ||
                  coalesce(m.location, '') || ' ' ||
                  coalesce(m.notes, '') || ' ' ||
                  coalesce(array_to_string(m.tags, ' '), '')
                ),
                plainto_tsquery('simple', ${q})
              ) as rank
            FROM meetings m
            LEFT JOIN visitors v ON m.visitor_id = v.id
            WHERE
              m.deleted_at IS NULL
              AND (${!canReadAllMeetings} = false OR (m.host_id = ${userId} OR m.created_by = ${userId}))
              AND (${dateFrom ?? null}::timestamptz IS NULL OR m.scheduled_at >= ${dateFrom ?? null}::timestamptz)
              AND (${dateTo ?? null}::timestamptz IS NULL OR m.scheduled_at <= ${dateTo ?? null}::timestamptz)
              AND (${!hasTagFilter} OR m.tags && ${tags}::text[])
              AND (
                ${!hasTextQuery} OR
                to_tsvector('simple',
                  coalesce(m.title, '') || ' ' ||
                  coalesce(m.description, '') || ' ' ||
                  coalesce(m.location, '') || ' ' ||
                  coalesce(m.notes, '') || ' ' ||
                  coalesce(array_to_string(m.tags, ' '), '')
                ) @@ plainto_tsquery('simple', ${q})
              )
            ORDER BY rank DESC NULLS LAST, m.scheduled_at DESC
            LIMIT 20
          `

    return NextResponse.json({
      data: { visitors, meetings },
      query: q,
      tags,
      type,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
