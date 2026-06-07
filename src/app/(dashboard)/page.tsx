import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CalendarCheck, UserCheck, Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { VISITOR_STATUSES, VISITOR_PURPOSES } from '@/constants'
import type { Visitor, Meeting } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const today = new Date()
  const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString()
  const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString()

  const [
    { count: totalVisitors },
    { count: todayVisitors },
    { count: arrivedVisitors },
    { count: scheduledMeetings },
    { data: recentVisitors },
    { data: upcomingMeetings },
  ] = await Promise.all([
    supabase.from('visitors').select('*', { count: 'exact', head: true }),
    supabase.from('visitors').select('*', { count: 'exact', head: true })
      .gte('scheduled_at', todayStart).lte('scheduled_at', todayEnd),
    supabase.from('visitors').select('*', { count: 'exact', head: true })
      .eq('status', 'arrived'),
    supabase.from('meetings').select('*', { count: 'exact', head: true })
      .eq('status', 'scheduled').gte('scheduled_at', new Date().toISOString()),
    supabase.from('visitors')
      .select('id, name, company, status, purpose, scheduled_at, host:host_id(name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('meetings')
      .select('id, title, scheduled_at, location, host:host_id(name)')
      .eq('status', 'scheduled')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(5),
  ])

  const stats = [
    { label: '전체 방문객', value: totalVisitors ?? 0, icon: Users, color: 'text-blue-600' },
    { label: '오늘 방문객', value: todayVisitors ?? 0, icon: CalendarCheck, color: 'text-green-600' },
    { label: '현재 입장', value: arrivedVisitors ?? 0, icon: UserCheck, color: 'text-orange-600' },
    { label: '예정 미팅', value: scheduledMeetings ?? 0, icon: Clock, color: 'text-purple-600' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
                </div>
                <Icon className={`h-8 w-8 ${color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 방문객 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">최근 방문객</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/visitors">전체보기</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentVisitors && recentVisitors.length > 0 ? (
              <ul className="space-y-3">
                {recentVisitors.map((v) => {
                  const visitor = v as unknown as Visitor & { host: { name: string } | null }
                  return (
                    <li key={v.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{v.name}</p>
                        <p className="text-xs text-gray-500">{v.company ?? '—'} · {VISITOR_PURPOSES[visitor.purpose]}</p>
                      </div>
                      <span className="text-xs text-gray-500">{VISITOR_STATUSES[visitor.status]}</span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">등록된 방문객이 없습니다.</p>
            )}
          </CardContent>
        </Card>

        {/* 예정 미팅 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">예정 미팅</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/meetings">전체보기</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingMeetings && upcomingMeetings.length > 0 ? (
              <ul className="space-y-3">
                {upcomingMeetings.map((m) => {
                  const meeting = m as unknown as Meeting & { host: { name: string } | null }
                  return (
                    <li key={m.id} className="text-sm">
                      <p className="font-medium text-gray-900">{m.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(m.scheduled_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {m.location ? ` · ${m.location}` : ''}
                      </p>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">예정된 미팅이 없습니다.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
