import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MeetingForm from '@/components/meetings/MeetingForm'

export default async function NewMeetingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: hosts }, { data: visitors }] = await Promise.all([
    supabase.from('users').select('id, name, email').eq('is_active', true).order('name'),
    supabase.from('visitors').select('id, name, company')
      .in('status', ['scheduled', 'arrived']).order('name'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">미팅 등록</h1>
        <p className="text-sm text-gray-500 mt-1">새 미팅 정보를 입력하세요.</p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <MeetingForm
          hosts={hosts ?? []}
          visitors={visitors ?? []}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}
