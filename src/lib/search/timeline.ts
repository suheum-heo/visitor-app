import sql from '@/lib/db'
import { hasPermission } from '@/lib/auth/permissions'
import type { TimelineItem, UserRole, MeetingType, AccessRecordCategory } from '@/types'

export interface TimelineQuery {
  company?: string
  keyword?: string
  tags?: string[]
  projectId?: string
  dateFrom?: string | null
  dateTo?: string | null
  userId: string
  role: UserRole
  limit?: number
}

function ilikePattern(value: string): string {
  return `%${value}%`
}

export async function searchTimeline(query: TimelineQuery): Promise<TimelineItem[]> {
  const {
    company = '',
    keyword = '',
    tags = [],
    projectId,
    dateFrom,
    dateTo,
    userId,
    role,
    limit = 50,
  } = query

  const hasCompany = company.trim().length > 0
  const hasKeyword = keyword.trim().length > 0
  const hasTags = tags.length > 0
  const hasProject = !!projectId
  const companyPattern = hasCompany ? ilikePattern(company.trim()) : null
  const keywordPattern = hasKeyword ? ilikePattern(keyword.trim()) : null

  const canReadAllVisitors = hasPermission(role, 'visitors.read.all')
  const canReadAllMeetings = hasPermission(role, 'meetings.read.all')
  const canReadAllTrips = hasPermission(role, 'trips.read.all')
  const canReadAccess = hasPermission(role, 'access.read')

  const items: TimelineItem[] = []

  if (hasPermission(role, 'visitors.read.own') || canReadAllVisitors) {
    const visitors = await sql<
      {
        id: string
        name: string
        company: string | null
        status: string
        scheduled_at: string | null
        project_name: string | null
      }[]
    >`
      SELECT v.id, v.name, v.company, v.status, v.scheduled_at,
             p.name as project_name
      FROM visitors v
      LEFT JOIN projects p ON v.project_id = p.id
      WHERE
        v.deleted_at IS NULL
        AND (${!canReadAllVisitors} = false OR (v.host_id = ${userId} OR v.created_by = ${userId}))
        AND (${dateFrom ?? null}::timestamptz IS NULL OR v.scheduled_at >= ${dateFrom ?? null}::timestamptz)
        AND (${dateTo ?? null}::timestamptz IS NULL OR v.scheduled_at <= ${dateTo ?? null}::timestamptz)
        AND (${!hasProject} OR v.project_id = ${projectId ?? null}::uuid)
        AND (${!hasTags} OR v.tags && ${tags}::text[])
        AND (
          ${!hasCompany} OR
          v.company ILIKE ${companyPattern} OR
          p.name ILIKE ${companyPattern} OR
          p.company ILIKE ${companyPattern}
        )
        AND (
          ${!hasKeyword} OR
          v.name ILIKE ${keywordPattern} OR
          v.company ILIKE ${keywordPattern} OR
          v.email ILIKE ${keywordPattern} OR
          v.phone ILIKE ${keywordPattern} OR
          v.notes ILIKE ${keywordPattern} OR
          p.name ILIKE ${keywordPattern}
        )
      ORDER BY v.scheduled_at DESC NULLS LAST
      LIMIT ${limit}
    `

    for (const v of visitors) {
      items.push({
        id: v.id,
        type: 'visitor',
        title: v.name,
        subtitle: `방문 · ${v.company ?? '회사 미지정'}`,
        occurred_at: v.scheduled_at ?? new Date().toISOString(),
        company: v.company,
        project_name: v.project_name,
        status: v.status,
        href: `/visitors/${v.id}`,
      })
    }
  }

  if (hasPermission(role, 'meetings.read.own') || canReadAllMeetings) {
    const meetings = await sql<
      {
        id: string
        title: string
        company: string | null
        meeting_type: string
        status: string
        scheduled_at: string
        visitor_name: string | null
        project_name: string | null
      }[]
    >`
      SELECT m.id, m.title, m.meeting_type, m.status, m.scheduled_at,
             v.company, v.name as visitor_name,
             p.name as project_name
      FROM meetings m
      LEFT JOIN visitors v ON m.visitor_id = v.id
      LEFT JOIN projects p ON m.project_id = p.id
      WHERE
        m.deleted_at IS NULL
        AND (${!canReadAllMeetings} = false OR (m.host_id = ${userId} OR m.created_by = ${userId}))
        AND (${dateFrom ?? null}::timestamptz IS NULL OR m.scheduled_at >= ${dateFrom ?? null}::timestamptz)
        AND (${dateTo ?? null}::timestamptz IS NULL OR m.scheduled_at <= ${dateTo ?? null}::timestamptz)
        AND (${!hasProject} OR m.project_id = ${projectId ?? null}::uuid)
        AND (${!hasTags} OR m.tags && ${tags}::text[])
        AND (
          ${!hasCompany} OR
          v.company ILIKE ${companyPattern} OR
          p.name ILIKE ${companyPattern} OR
          p.company ILIKE ${companyPattern}
        )
        AND (
          ${!hasKeyword} OR
          m.title ILIKE ${keywordPattern} OR
          m.description ILIKE ${keywordPattern} OR
          m.location ILIKE ${keywordPattern} OR
          m.notes ILIKE ${keywordPattern} OR
          v.name ILIKE ${keywordPattern} OR
          p.name ILIKE ${keywordPattern}
        )
      ORDER BY m.scheduled_at DESC
      LIMIT ${limit}
    `

    for (const m of meetings) {
      items.push({
        id: m.id,
        type: 'meeting',
        title: m.title,
        subtitle: `미팅 · ${m.visitor_name ?? '내부'}`,
        occurred_at: m.scheduled_at,
        company: m.company,
        project_name: m.project_name,
        status: m.status,
        meeting_type: m.meeting_type as MeetingType,
        href: `/meetings/${m.id}`,
      })
    }
  }

  if (hasPermission(role, 'trips.read.own') || canReadAllTrips) {
    const trips = await sql<
      {
        id: string
        title: string
        company: string | null
        location: string | null
        status: string
        scheduled_at: string
        employee_name: string | null
        project_name: string | null
      }[]
    >`
      SELECT bt.id, bt.title, bt.company, bt.location, bt.status, bt.scheduled_at,
             u.name as employee_name,
             p.name as project_name
      FROM business_trips bt
      LEFT JOIN users u ON bt.employee_id = u.id
      LEFT JOIN projects p ON bt.project_id = p.id
      WHERE
        bt.deleted_at IS NULL
        AND (${!canReadAllTrips} = false OR (bt.employee_id = ${userId} OR bt.created_by = ${userId}))
        AND (${dateFrom ?? null}::timestamptz IS NULL OR bt.scheduled_at >= ${dateFrom ?? null}::timestamptz)
        AND (${dateTo ?? null}::timestamptz IS NULL OR bt.scheduled_at <= ${dateTo ?? null}::timestamptz)
        AND (${!hasProject} OR bt.project_id = ${projectId ?? null}::uuid)
        AND (${!hasTags} OR bt.tags && ${tags}::text[])
        AND (
          ${!hasCompany} OR
          bt.company ILIKE ${companyPattern} OR
          p.name ILIKE ${companyPattern} OR
          p.company ILIKE ${companyPattern}
        )
        AND (
          ${!hasKeyword} OR
          bt.title ILIKE ${keywordPattern} OR
          bt.purpose ILIKE ${keywordPattern} OR
          bt.location ILIKE ${keywordPattern} OR
          bt.notes ILIKE ${keywordPattern} OR
          p.name ILIKE ${keywordPattern}
        )
      ORDER BY bt.scheduled_at DESC
      LIMIT ${limit}
    `

    for (const t of trips) {
      items.push({
        id: t.id,
        type: 'trip',
        title: t.title,
        subtitle: `출장 · ${t.employee_name ?? '—'} → ${t.company ?? t.location ?? '—'}`,
        occurred_at: t.scheduled_at,
        company: t.company,
        project_name: t.project_name,
        status: t.status,
        href: `/trips/${t.id}`,
      })
    }
  }

  if (canReadAccess) {
    const accessRows = await sql<
      {
        id: string
        name: string
        company: string | null
        record_category: string
        vehicle_number: string | null
        direction: string
        recorded_at: string
        project_name: string | null
      }[]
    >`
      SELECT ar.id, ar.name, ar.company, ar.record_category, ar.vehicle_number,
             ar.direction, ar.recorded_at,
             p.name as project_name
      FROM access_records ar
      LEFT JOIN projects p ON ar.project_id = p.id
      WHERE
        (${dateFrom ?? null}::timestamptz IS NULL OR ar.recorded_at >= ${dateFrom ?? null}::timestamptz)
        AND (${dateTo ?? null}::timestamptz IS NULL OR ar.recorded_at <= ${dateTo ?? null}::timestamptz)
        AND (${!hasProject} OR ar.project_id = ${projectId ?? null}::uuid)
        AND (
          ${!hasCompany} OR
          ar.company ILIKE ${companyPattern} OR
          p.name ILIKE ${companyPattern} OR
          p.company ILIKE ${companyPattern}
        )
        AND (
          ${!hasKeyword} OR
          ar.name ILIKE ${keywordPattern} OR
          ar.company ILIKE ${keywordPattern} OR
          ar.vehicle_number ILIKE ${keywordPattern} OR
          ar.notes ILIKE ${keywordPattern} OR
          p.name ILIKE ${keywordPattern}
        )
      ORDER BY ar.recorded_at DESC
      LIMIT ${limit}
    `

    for (const ar of accessRows) {
      const categoryLabel =
        ar.record_category === 'vehicle' ? '차량 출입' :
        ar.record_category === 'delivery' ? '납품 출입' : '출입'
      const vehicleInfo = ar.vehicle_number ? ` · ${ar.vehicle_number}` : ''
      items.push({
        id: ar.id,
        type: 'access',
        title: ar.name,
        subtitle: `${categoryLabel}${vehicleInfo}`,
        occurred_at: ar.recorded_at,
        company: ar.company,
        project_name: ar.project_name,
        status: ar.direction,
        record_category: ar.record_category as AccessRecordCategory,
        href: '/access-records',
      })
    }
  }

  items.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
  return items.slice(0, limit)
}

export function timelineToCsv(items: TimelineItem[]): string {
  const header = ['일시', '유형', '제목', '설명', '회사', '프로젝트', '상태']
  const rows = items.map((item) => [
    new Date(item.occurred_at).toISOString(),
    item.type,
    item.title,
    item.subtitle,
    item.company ?? '',
    item.project_name ?? '',
    item.status ?? '',
  ])
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  return [header, ...rows].map((row) => row.map(escape).join(',')).join('\n')
}
