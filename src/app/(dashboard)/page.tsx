import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CalendarCheck, UserCheck, Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { VISITOR_STATUSES, VISITOR_PURPOSES } from '@/constants'
import type { VisitorPurpose, VisitorStatus } from '@/types'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const [
    [{ count: totalVisitors }],
    [{ count: todayVisitors }],
    [{ count: arrivedVisitors }],
    [{ count: scheduledMeetings }],
    recentVisitors,
    upcomingMeetings,
  ] = await Promise.all([
    sql<{ count: string }[]>`SELECT COUNT(*)::text as count FROM visitors`,
    sql<{ count: string }[]>`
      SELECT COUNT(*)::text as count FROM visitors
      WHERE scheduled_at BETWEEN ${todayStart.toISOString()} AND ${todayEnd.toISOString()}
    `,
    sql<{ count: string }[]>`SELECT COUNT(*)::text as count FROM visitors WHERE status = 'arrived'`,
    sql<{ count: string }[]>`
      SELECT COUNT(*)::text as count FROM meetings
      WHERE status = 'scheduled' AND scheduled_at > now()
    `,
    sql<{ id: string; name: string; company: string | null; status: VisitorStatus; purpose: VisitorPurpose }[]>`
      SELECT v.id, v.name, v.company, v.status, v.purpose
      FROM visitors v
      ORDER BY v.created_at DESC LIMIT 5
    `,
    sql<{ id: string; title: string; scheduled_at: string; location: string | null }[]>`
      SELECT id, title, scheduled_at, location
      FROM meetings
      WHERE status = 'scheduled' AND scheduled_at > now()
      ORDER BY scheduled_at ASC LIMIT 5
    `,
  ])

  const stats = [
    { label: '전체 방문객', value: parseInt(totalVisitors), icon: Users, color: 'text-blue-600' },
    { label: '오늘 방문객', value: parseInt(todayVisitors), icon: CalendarCheck, color: 'text-green-600' },
    { label: '현재 입장', value: parseInt(arrivedVisitors), icon: UserCheck, color: 'text-orange-600' },
    { label: '예정 미팅', value: parseInt(scheduledMeetings), icon: Clock, color: 'text-purple-600' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </div>

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">최근 방문객</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/visitors">전체보기</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentVisitors.length > 0 ? (
              <ul className="space-y-3">
                {recentVisitors.map((v) => (
                  <li key={v.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{v.name}</p>
                      <p className="text-xs text-gray-500">{v.company ?? '—'} · {VISITOR_PURPOSES[v.purpose]}</p>
                    </div>
                    <span className="text-xs text-gray-500">{VISITOR_STATUSES[v.status]}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">등록된 방문객이 없습니다.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">예정 미팅</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/meetings">전체보기</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingMeetings.length > 0 ? (
              <ul className="space-y-3">
                {upcomingMeetings.map((m) => (
                  <li key={m.id} className="text-sm">
                    <p className="font-medium text-gray-900">{m.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(m.scheduled_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {m.location ? ` · ${m.location}` : ''}
                    </p>
                  </li>
                ))}
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
