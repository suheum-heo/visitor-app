import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import { hasPermission } from '@/lib/auth/rbac'
import AccessRecordsPageClient from '@/components/access/AccessRecordsPageClient'
import type { UserRole } from '@/types'

export default async function AccessRecordsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const role = session.user.role as UserRole
  if (!hasPermission(role, 'access.read')) redirect('/')

  const canCreate = hasPermission(role, 'access.create')
  const canSync = hasPermission(role, 'access.sync')

  const visitors = canCreate
    ? await sql<{ id: string; name: string; company: string | null }[]>`
        SELECT id, name, company FROM visitors
        WHERE deleted_at IS NULL AND status IN ('scheduled', 'arrived')
        ORDER BY name
      `
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">출입 기록</h1>
        <p className="text-sm text-gray-500 mt-1">출입 기록 조회 및 수동 등록</p>
      </div>

      <AccessRecordsPageClient
        visitors={visitors}
        canCreate={canCreate}
        canSync={canSync}
      />
    </div>
  )
}
