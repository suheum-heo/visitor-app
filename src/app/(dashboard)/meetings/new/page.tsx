import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import MeetingForm from '@/components/meetings/MeetingForm'

export default async function NewMeetingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [hosts, visitors] = await Promise.all([
    sql<{ id: string; name: string | null; email: string }[]>`
      SELECT id, name, email FROM users WHERE is_active = true ORDER BY name
    `,
    sql<{ id: string; name: string; company: string | null }[]>`
      SELECT id, name, company FROM visitors
      WHERE deleted_at IS NULL AND status IN ('scheduled', 'arrived')
      ORDER BY name
    `,
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">미팅 등록</h1>
        <p className="text-sm text-gray-500 mt-1">새 미팅 정보를 입력하세요.</p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <MeetingForm hosts={hosts} visitors={visitors} currentUserId={session.user.id} />
      </div>
    </div>
  )
}
