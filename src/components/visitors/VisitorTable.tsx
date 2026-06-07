'use client'

import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import VisitorStatusBadge from './VisitorStatusBadge'
import { VISITOR_PURPOSES } from '@/constants'
import type { Visitor, User } from '@/types'

type VisitorWithRelations = Visitor & {
  host: Pick<User, 'id' | 'name' | 'email' | 'department'> | null
}

interface VisitorTableProps {
  visitors: VisitorWithRelations[]
  onStatusChange?: (id: string, status: Visitor['status']) => void
}

export default function VisitorTable({ visitors, onStatusChange }: VisitorTableProps) {
  if (visitors.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-gray-500">
        등록된 방문객이 없습니다.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>이름</TableHead>
          <TableHead>회사</TableHead>
          <TableHead>방문 목적</TableHead>
          <TableHead>담당자</TableHead>
          <TableHead>예정 시간</TableHead>
          <TableHead>상태</TableHead>
          <TableHead className="text-right">관리</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {visitors.map((visitor) => (
          <TableRow key={visitor.id}>
            <TableCell className="font-medium">{visitor.name}</TableCell>
            <TableCell>{visitor.company ?? '—'}</TableCell>
            <TableCell>{VISITOR_PURPOSES[visitor.purpose]}</TableCell>
            <TableCell>{visitor.host?.name ?? '—'}</TableCell>
            <TableCell>
              {visitor.scheduled_at
                ? new Date(visitor.scheduled_at).toLocaleString('ko-KR', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })
                : '—'}
            </TableCell>
            <TableCell>
              <VisitorStatusBadge status={visitor.status} />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                {onStatusChange && visitor.status === 'scheduled' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusChange(visitor.id, 'arrived')}
                  >
                    입장
                  </Button>
                )}
                {onStatusChange && visitor.status === 'arrived' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusChange(visitor.id, 'departed')}
                  >
                    퇴장
                  </Button>
                )}
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/visitors/${visitor.id}`}>상세</Link>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
