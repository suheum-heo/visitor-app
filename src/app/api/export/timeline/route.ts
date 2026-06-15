import { auth } from '@/auth'
import { hasPermission } from '@/lib/auth/rbac'
import { parseTagsParam } from '@/lib/tags'
import { searchTimeline, timelineToCsv } from '@/lib/search/timeline'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = session.user.role as UserRole
    if (!hasPermission(role, 'reports.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const qCompany = searchParams.get('q_company')?.trim() ?? ''
    const qKeyword = searchParams.get('q_keyword')?.trim() ?? ''
    const legacyQ = searchParams.get('q')?.trim() ?? ''
    const company = qCompany || legacyQ
    const keyword = qKeyword || (qCompany ? '' : legacyQ)
    const tags = parseTagsParam(searchParams.get('tags'))
    const projectId = searchParams.get('project_id') ?? undefined
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    const items = await searchTimeline({
      company,
      keyword,
      tags,
      projectId,
      dateFrom,
      dateTo,
      userId: session.user.id,
      role,
      limit: 500,
    })

    const csv = '\uFEFF' + timelineToCsv(items)
    const filename = `timeline-export-${new Date().toISOString().slice(0, 10)}.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
