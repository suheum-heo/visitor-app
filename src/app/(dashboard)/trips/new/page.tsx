import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import { hasPermission } from '@/lib/auth/rbac'
import BusinessTripForm from '@/components/trips/BusinessTripForm'
import type { UserRole } from '@/types'

export default async function NewTripPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const role = session.user.role as UserRole
  if (!hasPermission(role, 'trips.create')) redirect('/trips')

  const employees = await sql<{ id: string; name: string | null; email: string }[]>`
    SELECT id, name, email FROM users WHERE is_active = true ORDER BY name
  `

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">출장 등록</h1>
        <p className="text-sm text-gray-500 mt-1">직원 출장 정보를 입력하세요.</p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <BusinessTripForm employees={employees} currentUserId={session.user.id} />
      </div>
    </div>
  )
}
