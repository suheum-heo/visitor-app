import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import sql from '@/lib/db'
import { hasPermission } from '@/lib/auth/rbac'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import BusinessTripForm from '@/components/trips/BusinessTripForm'
import { TRIP_STATUSES } from '@/constants'
import { formatDateTimeKorean } from '@/lib/datetime-local'
import type { BusinessTrip, TripStatus, User, UserRole } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TripDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

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

  if (!trip) notFound()

  const role = session.user.role as UserRole
  const canReadAll = hasPermission(role, 'trips.read.all')
  if (!canReadAll && trip.employee_id !== session.user.id && trip.created_by !== session.user.id) {
    redirect('/trips')
  }

  const canEdit =
    hasPermission(role, 'trips.update.all') ||
    (hasPermission(role, 'trips.update.own') &&
      (trip.employee_id === session.user.id || trip.created_by === session.user.id))

  const employees = await sql<{ id: string; name: string | null; email: string }[]>`
    SELECT id, name, email FROM users WHERE is_active = true ORDER BY name
  `

  const t = trip as BusinessTrip & {
    employee: Pick<User, 'id' | 'name' | 'email' | 'department'>
    project: { id: string; name: string; company: string | null } | null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t.employee?.name ?? '—'} · {t.company ?? t.location ?? '—'}
          </p>
        </div>
        <Badge variant="outline">{TRIP_STATUSES[t.status as TripStatus]}</Badge>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3 text-sm">
        <p><span className="text-gray-500">출발:</span> {formatDateTimeKorean(t.scheduled_at)}</p>
        {t.end_at && (
          <p><span className="text-gray-500">복귀:</span> {formatDateTimeKorean(t.end_at)}</p>
        )}
        {t.purpose && <p><span className="text-gray-500">목적:</span> {t.purpose}</p>}
        {t.project && (
          <p><span className="text-gray-500">프로젝트:</span> {t.project.name}{t.project.company ? ` (${t.project.company})` : ''}</p>
        )}
        {t.tags?.length > 0 && <p><span className="text-gray-500">태그:</span> {t.tags.join(', ')}</p>}
        {t.notes && <p><span className="text-gray-500">메모:</span> {t.notes}</p>}
      </div>

      {canEdit && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">출장 수정</h2>
          <BusinessTripForm trip={t} employees={employees} currentUserId={session.user.id} />
        </div>
      )}

      <Button variant="outline" asChild>
        <Link href="/trips">목록으로</Link>
      </Button>
    </div>
  )
}
