'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { VISITOR_STATUSES } from '@/constants'
import type { VisitorStatus } from '@/types'

const statuses: Array<VisitorStatus | ''> = ['', 'scheduled', 'arrived', 'departed', 'cancelled']

interface VisitorFiltersProps {
  currentStatus?: string
  currentSearch?: string
}

export default function VisitorFilters({ currentStatus, currentSearch }: VisitorFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`/visitors?${params}`)
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Input
        className="w-64"
        placeholder="이름, 회사, 이메일 검색..."
        defaultValue={currentSearch}
        onChange={(e) => updateFilter('search', e.target.value)}
      />
      <div className="flex gap-2">
        {statuses.map((s) => (
          <Button
            key={s}
            variant={currentStatus === s || (!currentStatus && s === '') ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('status', s)}
          >
            {s === '' ? '전체' : VISITOR_STATUSES[s as VisitorStatus]}
          </Button>
        ))}
      </div>
    </div>
  )
}
