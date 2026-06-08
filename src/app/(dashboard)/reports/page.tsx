import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { hasPermission } from '@/lib/auth/rbac'
import ReportsCharts from '@/components/reports/ReportsCharts'
import type { UserRole } from '@/types'

export default async function ReportsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const role = session.user.role as UserRole
  if (!hasPermission(role, 'reports.read')) {
    redirect('/')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">보고서 / 통계</h1>
        <p className="text-sm text-gray-500 mt-1">방문객·미팅 현황을 차트로 확인합니다.</p>
      </div>
      <ReportsCharts />
    </div>
  )
}
