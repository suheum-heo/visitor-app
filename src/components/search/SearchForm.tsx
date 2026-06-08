'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'

const TYPE_ITEMS = [
  { value: 'all', label: '전체' },
  { value: 'visitor', label: '방문객' },
  { value: 'meeting', label: '미팅' },
] as const

export default function SearchForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [type, setType] = useState(searchParams.get('type') ?? 'all')
  const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') ?? '')
  const [dateTo, setDateTo] = useState(searchParams.get('date_to') ?? '')
  const [tags, setTags] = useState(searchParams.get('tags') ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (type !== 'all') params.set('type', type)
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    if (tags.trim()) params.set('tags', tags.trim())
    router.push(`/search?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex gap-3">
        <div className="flex-1 space-y-2">
          <Label htmlFor="search-q">검색어</Label>
          <Input
            id="search-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="이름, 회사, 제목, 장소 등"
          />
        </div>
        <div className="w-40 space-y-2">
          <Label>유형</Label>
          <Select
            value={type}
            onValueChange={(v) => v && setType(v)}
            items={[...TYPE_ITEMS]}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="visitor">방문객</SelectItem>
              <SelectItem value="meeting">미팅</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="search-tags">태그 (쉼표로 구분)</Label>
        <Input
          id="search-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="vip, partner"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date-from">시작일</Label>
          <Input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date-to">종료일</Label>
          <Input
            id="date-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      <Button type="submit">
        <Search className="h-4 w-4 mr-1" />
        검색
      </Button>
    </form>
  )
}
