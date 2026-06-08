import { auth } from '@/auth'
import sql from '@/lib/db'
import { hasPermission } from '@/lib/auth/rbac'
import { NextResponse } from 'next/server'
import type { UserRole } from '@/types'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = session.user.role as UserRole
    if (!hasPermission(role, 'reports.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [visitorsByMonth, visitorsByCompany, meetingsByMonth, peakVisitHours] = await Promise.all([
      sql<{ month: string; count: string }[]>`
        SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
               COUNT(*)::text as count
        FROM visitors
        WHERE deleted_at IS NULL
          AND created_at >= date_trunc('month', now()) - interval '11 months'
        GROUP BY 1
        ORDER BY 1
      `,
      sql<{ company: string; count: string }[]>`
        SELECT COALESCE(NULLIF(TRIM(company), ''), '미지정') as company,
               COUNT(*)::text as count
        FROM visitors
        WHERE deleted_at IS NULL
        GROUP BY 1
        ORDER BY count DESC
        LIMIT 10
      `,
      sql<{ month: string; count: string }[]>`
        SELECT to_char(date_trunc('month', scheduled_at), 'YYYY-MM') as month,
               COUNT(*)::text as count
        FROM meetings
        WHERE deleted_at IS NULL
          AND scheduled_at >= date_trunc('month', now()) - interval '11 months'
        GROUP BY 1
        ORDER BY 1
      `,
      sql<{ hour: string; count: string }[]>`
        SELECT EXTRACT(HOUR FROM COALESCE(arrived_at, scheduled_at))::int::text as hour,
               COUNT(*)::text as count
        FROM visitors
        WHERE deleted_at IS NULL
          AND COALESCE(arrived_at, scheduled_at) IS NOT NULL
        GROUP BY 1
        ORDER BY 1
      `,
    ])

    return NextResponse.json({
      data: {
        visitors_by_month: visitorsByMonth.map((r) => ({
          month: r.month,
          count: parseInt(r.count),
        })),
        visitors_by_company: visitorsByCompany.map((r) => ({
          company: r.company,
          count: parseInt(r.count),
        })),
        meetings_by_month: meetingsByMonth.map((r) => ({
          month: r.month,
          count: parseInt(r.count),
        })),
        peak_visit_hours: peakVisitHours.map((r) => ({
          hour: parseInt(r.hour),
          count: parseInt(r.count),
        })),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
