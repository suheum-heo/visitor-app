'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { TIMELINE_TYPE_LABELS } from '@/constants'
import type { TimelineItem } from '@/types'

export default function SearchResults() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<TimelineItem[]>([])
  const [queried, setQueried] = useState(false)

  const qCompany = searchParams.get('q_company') ?? searchParams.get('q') ?? ''
  const qKeyword = searchParams.get('q_keyword') ?? ''
  const tags = searchParams.get('tags') ?? ''

  const hasQuery = qCompany.trim() || qKeyword.trim() || tags.trim()

  useEffect(() => {
    if (!hasQuery) {
      setItems([])
      setQueried(false)
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    setLoading(true)
    fetch(`/api/search/timeline?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        setItems(json.data ?? [])
        setQueried(true)
      })
      .finally(() => setLoading(false))
  }, [searchParams, hasQuery, qCompany, qKeyword, tags])

  if (!hasQuery) {
    return (
      <p className="text-sm text-gray-500">
        회사/프로젝트, 키워드, 또는 태그를 입력하면 방문·미팅·출장·출입 기록이 시간순으로 표시됩니다.
      </p>
    )
  }

  if (loading) {
    return <p className="text-sm text-gray-500">검색 중...</p>
  }

  if (queried && items.length === 0) {
    const label = [
      qCompany && `회사/프로젝트: "${qCompany}"`,
      qKeyword && `키워드: "${qKeyword}"`,
      tags && `태그: ${tags}`,
    ].filter(Boolean).join(' · ')
    return <p className="text-sm text-gray-500">{label}에 대한 결과가 없습니다.</p>
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="font-semibold text-gray-900 mb-4">업무 스토리 ({items.length}건)</h2>
      <ul className="divide-y divide-gray-100">
        {items.map((item) => (
          <li key={`${item.type}-${item.id}`} className="py-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">{TIMELINE_TYPE_LABELS[item.type]}</Badge>
                <span className="text-xs text-gray-500">
                  {new Date(item.occurred_at).toLocaleString('ko-KR')}
                </span>
              </div>
              <Link href={item.href} className="font-medium text-blue-600 hover:underline">
                {item.title}
              </Link>
              <p className="text-sm text-gray-500 mt-0.5">{item.subtitle}</p>
              {(item.company || item.project_name) && (
                <p className="text-xs text-gray-400 mt-1">
                  {[item.company, item.project_name].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
