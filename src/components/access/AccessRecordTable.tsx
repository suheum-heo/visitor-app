'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ACCESS_DIRECTIONS, ACCESS_SOURCES } from '@/constants'
import type { AccessRecord, AccessDirection, AccessSource } from '@/types'

interface AccessRecordTableProps {
  refreshKey?: number
}

export default function AccessRecordTable({ refreshKey }: AccessRecordTableProps) {
  const [records, setRecords] = useState<AccessRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/access-records?limit=50')
      if (res.ok) {
        const { data } = await res.json()
        setRecords(data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords, refreshKey])

  if (loading) return <p className="text-sm text-gray-500">불러오는 중...</p>

  if (records.length === 0) {
    return <p className="text-sm text-gray-500">출입 기록이 없습니다.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>시간</TableHead>
          <TableHead>이름</TableHead>
          <TableHead>회사</TableHead>
          <TableHead>방향</TableHead>
          <TableHead>출입구</TableHead>
          <TableHead>출처</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="whitespace-nowrap">
              {new Date(r.recorded_at).toLocaleString('ko-KR')}
            </TableCell>
            <TableCell className="font-medium">{r.name}</TableCell>
            <TableCell>{r.company ?? '—'}</TableCell>
            <TableCell>
              <Badge variant={r.direction === 'in' ? 'default' : 'secondary'}>
                {ACCESS_DIRECTIONS[r.direction as AccessDirection]}
              </Badge>
            </TableCell>
            <TableCell>{r.access_point ?? '—'}</TableCell>
            <TableCell className="text-gray-500">
              {ACCESS_SOURCES[r.source as AccessSource]}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
