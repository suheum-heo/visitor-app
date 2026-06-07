import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import sql from '@/lib/db'
import { hasPermission } from '@/lib/auth/rbac'
import MeetingForm from '@/components/meetings/MeetingForm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { MEETING_STATUSES } from '@/constants'
import type { Meeting, User, Visitor, MeetingStatus, UserRole } from '@/types'

const statusVariant: Record<MeetingStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  scheduled: 'outline', in_progress: 'default', completed: 'secondary', cancelled: 'destructive',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MeetingDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [meeting] = await sql`
    SELECT m.*,
      json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'department', u.department) as host,
      CASE WHEN v.id IS NOT NULL
        THEN json_build_object('id', v.id, 'name', v.name, 'company', v.company)
        ELSE null END as visitor
    FROM meetings m
    LEFT JOIN users u ON m.host_id = u.id
    LEFT JOIN visitors v ON m.visitor_id = v.id
    WHERE m.id = ${id}
  `
  if (!meeting) notFound()

  const role = session.user.role as UserRole
  const canEdit =
    hasPermission(role, 'meetings.update.all') ||
    (hasPermission(role, 'meetings.update.own') &&
      (meeting.host_id === session.user.id || meeting.created_by === session.user.id))

  const [hosts, visitors] = await Promise.all([
    sql<{ id: string; name: string | null; email: string }[]>`
      SELECT id, name, email FROM users WHERE is_active = true ORDER BY name
    `,
    sql<{ id: string; name: string; company: string | null }[]>`
      SELECT id, name, company FROM visitors WHERE status IN ('scheduled', 'arrived') ORDER BY name
    `,
  ])

  const m = meeting as unknown as Meeting & {
    host: Pick<User, 'id' | 'name' | 'email' | 'department'> | null
    visitor: Pick<Visitor, 'id' | 'name' | 'company'> | null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{m.title}</h1>
            <Badge variant={statusVariant[m.status]}>{MEETING_STATUSES[m.status]}</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(m.scheduled_at).toLocaleString('ko-KR')}
            {m.location ? ` · ${m.location}` : ''}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/meetings">목록으로</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">미팅 정보</h2>
          <dl className="space-y-3 text-sm">
            <div><dt className="text-gray-500">담당자</dt><dd className="font-medium mt-0.5">{m.host?.name ?? '—'}</dd></div>
            {m.visitor && (
              <div>
                <dt className="text-gray-500">방문객</dt>
                <dd className="font-medium mt-0.5">{m.visitor.name}{m.visitor.company ? ` (${m.visitor.company})` : ''}</dd>
              </div>
            )}
            <div><dt className="text-gray-500">소요 시간</dt><dd className="font-medium mt-0.5">{m.duration_minutes}분</dd></div>
            {m.description && (
              <div><dt className="text-gray-500">설명</dt><dd className="mt-0.5 whitespace-pre-wrap">{m.description}</dd></div>
            )}
            {m.notes && (
              <div><dt className="text-gray-500">메모</dt><dd className="mt-0.5 whitespace-pre-wrap">{m.notes}</dd></div>
            )}
          </dl>
        </div>

        {canEdit && (
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">정보 수정</h2>
            <MeetingForm meeting={m} hosts={hosts} visitors={visitors} currentUserId={session.user.id} />
          </div>
        )}
      </div>
    </div>
  )
}
