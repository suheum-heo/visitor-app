import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import VisitorForm from '@/components/visitors/VisitorForm'

export default async function NewVisitorPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const hosts = await sql<{ id: string; name: string | null; email: string }[]>`
    SELECT id, name, email FROM users WHERE is_active = true ORDER BY name
  `

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">방문객 등록</h1>
        <p className="text-sm text-gray-500 mt-1">새 방문객 정보를 입력하세요.</p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <VisitorForm hosts={hosts} currentUserId={session.user.id} />
      </div>
    </div>
  )
}
