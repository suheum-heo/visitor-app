import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getUserRole } from '@/lib/auth/rbac'
import { hasPermission } from '@/lib/auth/rbac'
import VisitorForm from '@/components/visitors/VisitorForm'
import VisitorStatusBadge from '@/components/visitors/VisitorStatusBadge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { VISITOR_PURPOSES } from '@/constants'
import type { Visitor, User } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function VisitorDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: visitor } = await supabase
    .from('visitors')
    .select(`*, host:host_id(id, name, email, department), creator:created_by(id, name)`)
    .eq('id', id)
    .single()

  if (!visitor) notFound()

  const role = await getUserRole(authUser.id)
  if (!role) redirect('/login')

  const canEdit =
    hasPermission(role, 'visitors.update.all') ||
    (hasPermission(role, 'visitors.update.own') &&
      (visitor.host_id === authUser.id || visitor.created_by === authUser.id))

  const { data: hosts } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('is_active', true)
    .order('name')

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
            {VISITOR_PURPOSES[v.purpose]}
            {v.company ? ` · ${v.company}` : ''}
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
              <div>
                <dt className="text-gray-500">연락처</dt>
                <dd className="font-medium mt-0.5">{v.phone}</dd>
              </div>
            )}
            {v.email && (
              <div>
                <dt className="text-gray-500">이메일</dt>
                <dd className="font-medium mt-0.5">{v.email}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500">담당자</dt>
              <dd className="font-medium mt-0.5">{v.host?.name ?? '—'}</dd>
            </div>
            {v.scheduled_at && (
              <div>
                <dt className="text-gray-500">방문 예정</dt>
                <dd className="font-medium mt-0.5">
                  {new Date(v.scheduled_at).toLocaleString('ko-KR')}
                </dd>
              </div>
            )}
            {v.arrived_at && (
              <div>
                <dt className="text-gray-500">입장 시간</dt>
                <dd className="font-medium mt-0.5">
                  {new Date(v.arrived_at).toLocaleString('ko-KR')}
                </dd>
              </div>
            )}
            {v.departed_at && (
              <div>
                <dt className="text-gray-500">퇴장 시간</dt>
                <dd className="font-medium mt-0.5">
                  {new Date(v.departed_at).toLocaleString('ko-KR')}
                </dd>
              </div>
            )}
            {v.notes && (
              <div>
                <dt className="text-gray-500">메모</dt>
                <dd className="mt-0.5 whitespace-pre-wrap">{v.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {canEdit && (
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">정보 수정</h2>
            <VisitorForm
              visitor={v}
              hosts={hosts ?? []}
              currentUserId={authUser.id}
            />
          </div>
        )}
      </div>
    </div>
  )
}
