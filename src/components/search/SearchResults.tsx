'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { VISITOR_STATUSES, MEETING_STATUSES } from '@/constants'
import type { VisitorStatus, MeetingStatus } from '@/types'

interface SearchVisitor {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  status: VisitorStatus
  scheduled_at: string | null
}

interface SearchMeeting {
  id: string
  title: string
  description: string | null
  location: string | null
  status: MeetingStatus
  scheduled_at: string
  visitor: { id: string; name: string; company: string | null } | null
}

export default function SearchResults() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [visitors, setVisitors] = useState<SearchVisitor[]>([])
  const [meetings, setMeetings] = useState<SearchMeeting[]>([])
  const [queried, setQueried] = useState(false)

  const q = searchParams.get('q') ?? ''

  useEffect(() => {
    if (!q.trim()) {
      setVisitors([])
      setMeetings([])
      setQueried(false)
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    setLoading(true)
    fetch(`/api/search?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        setVisitors(json.data?.visitors ?? [])
        setMeetings(json.data?.meetings ?? [])
        setQueried(true)
      })
      .finally(() => setLoading(false))
  }, [searchParams, q])

  if (!q.trim()) {
    return <p className="text-sm text-gray-500">검색어를 입력하세요.</p>
  }

  if (loading) {
    return <p className="text-sm text-gray-500">검색 중...</p>
  }

  if (queried && visitors.length === 0 && meetings.length === 0) {
    return <p className="text-sm text-gray-500">&quot;{q}&quot;에 대한 결과가 없습니다.</p>
  }

  return (
    <div className="space-y-6">
      {visitors.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">방문객 ({visitors.length})</h2>
          <ul className="divide-y divide-gray-100">
            {visitors.map((v) => (
              <li key={v.id} className="py-3 flex items-center justify-between">
                <div>
                  <Link href={`/visitors/${v.id}`} className="font-medium text-blue-600 hover:underline">
                    {v.name}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {v.company ?? '—'}
                    {v.scheduled_at ? ` · ${new Date(v.scheduled_at).toLocaleDateString('ko-KR')}` : ''}
                  </p>
                </div>
                <Badge variant="outline">{VISITOR_STATUSES[v.status]}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}

      {meetings.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">미팅 ({meetings.length})</h2>
          <ul className="divide-y divide-gray-100">
            {meetings.map((m) => (
              <li key={m.id} className="py-3 flex items-center justify-between">
                <div>
                  <Link href={`/meetings/${m.id}`} className="font-medium text-blue-600 hover:underline">
                    {m.title}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {new Date(m.scheduled_at).toLocaleString('ko-KR')}
                    {m.location ? ` · ${m.location}` : ''}
                    {m.visitor ? ` · ${m.visitor.name}` : ''}
                  </p>
                </div>
                <Badge variant="outline">{MEETING_STATUSES[m.status]}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
