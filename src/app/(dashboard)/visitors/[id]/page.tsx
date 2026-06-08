import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import sql from '@/lib/db'
import { hasPermission } from '@/lib/auth/rbac'
import VisitorFormWithOcr from '@/components/visitors/VisitorFormWithOcr'
import VisitorStatusBadge from '@/components/visitors/VisitorStatusBadge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { VISITOR_PURPOSES } from '@/constants'
import type { Visitor, User, UserRole } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function VisitorDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [visitor] = await sql`
    SELECT v.*,
      json_build_object('id', u1.id, 'name', u1.name, 'email', u1.email, 'department', u1.department) as host,
      json_build_object('id', u2.id, 'name', u2.name) as creator
    FROM visitors v
    LEFT JOIN users u1 ON v.host_id = u1.id
    LEFT JOIN users u2 ON v.created_by = u2.id
    WHERE v.id = ${id}
  `
  if (!visitor) notFound()

  const role = session.user.role as UserRole
  const canEdit =
    hasPermission(role, 'visitors.update.all') ||
    (hasPermission(role, 'visitors.update.own') &&
      (visitor.host_id === session.user.id || visitor.created_by === session.user.id))

  const hosts = await sql<{ id: string; name: string | null; email: string }[]>`
    SELECT id, name, email FROM users WHERE is_active = true ORDER BY name
  `

  const v = visitor as unknown as Visitor & { host: Pick<User, 'id' | 'name' | 'email' | 'department'> | null }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{v.name}</h1>
            <VisitorStatusBadge status={v.status} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {VISITOR_PURPOSES[v.purpose]}{v.company ? ` · ${v.company}` : ''}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/visitors">목록으로</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">방문객 정보</h2>
          <dl className="space-y-3 text-sm">
            {v.phone && (
              <div><dt className="text-gray-500">연락처</dt><dd className="font-medium mt-0.5">{v.phone}</dd></div>
            )}
            {v.email && (
              <div><dt className="text-gray-500">이메일</dt><dd className="font-medium mt-0.5">{v.email}</dd></div>
            )}
            <div><dt className="text-gray-500">담당자</dt><dd className="font-medium mt-0.5">{v.host?.name ?? '—'}</dd></div>
            {v.scheduled_at && (
              <div>
                <dt className="text-gray-500">방문 예정</dt>
                <dd className="font-medium mt-0.5">{new Date(v.scheduled_at).toLocaleString('ko-KR')}</dd>
              </div>
            )}
            {v.notes && (
              <div><dt className="text-gray-500">메모</dt><dd className="mt-0.5 whitespace-pre-wrap">{v.notes}</dd></div>
            )}
          </dl>
        </div>

        {canEdit && (
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">정보 수정</h2>
            <VisitorFormWithOcr
              visitor={v}
              hosts={hosts}
              currentUserId={session.user.id}
            />
          </div>
        )}
      </div>
    </div>
  )
}
