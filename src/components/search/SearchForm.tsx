'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Download } from 'lucide-react'
import { hasPermission } from '@/lib/auth/permissions'
import type { UserRole } from '@/types'

interface SearchFormProps {
  userRole: UserRole
}

export default function SearchForm({ userRole }: SearchFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [qCompany, setQCompany] = useState(searchParams.get('q_company') ?? searchParams.get('q') ?? '')
  const [qKeyword, setQKeyword] = useState(searchParams.get('q_keyword') ?? '')
  const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') ?? '')
  const [dateTo, setDateTo] = useState(searchParams.get('date_to') ?? '')
  const [tags, setTags] = useState(searchParams.get('tags') ?? '')

  const canExport = hasPermission(userRole, 'reports.read')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (qCompany.trim()) params.set('q_company', qCompany.trim())
    if (qKeyword.trim()) params.set('q_keyword', qKeyword.trim())
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    if (tags.trim()) params.set('tags', tags.trim())
    router.push(`/search?${params.toString()}`)
  }

  function handleExport() {
    const params = new URLSearchParams()
    if (qCompany.trim()) params.set('q_company', qCompany.trim())
    if (qKeyword.trim()) params.set('q_keyword', qKeyword.trim())
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    if (tags.trim()) params.set('tags', tags.trim())
    window.open(`/api/export/timeline?${params.toString()}`, '_blank')
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="search-company">검색어 1 — 회사 / 프로젝트</Label>
          <Input
            id="search-company"
            value={qCompany}
            onChange={(e) => setQCompany(e.target.value)}
            placeholder="삼성전자, 배터리 프로젝트"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="search-keyword">검색어 2 — 키워드</Label>
          <Input
            id="search-keyword"
            value={qKeyword}
            onChange={(e) => setQKeyword(e.target.value)}
            placeholder="담당자명, 미팅 제목, 차량번호"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="search-tags">태그 (쉼표로 구분, 등록 시 입력한 태그와 일치)</Label>
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

      <div className="flex gap-2">
        <Button type="submit">
          <Search className="h-4 w-4 mr-1" />
          통합 검색
        </Button>
        {canExport && (
          <Button type="button" variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            CSV보내기
          </Button>
        )}
      </div>
    </form>
  )
}
