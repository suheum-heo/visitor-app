import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VisitorForm from '@/components/visitors/VisitorForm'

export default async function NewVisitorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: hosts } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">방문객 등록</h1>
        <p className="text-sm text-gray-500 mt-1">새 방문객 정보를 입력하세요.</p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <VisitorForm
          hosts={hosts ?? []}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}
