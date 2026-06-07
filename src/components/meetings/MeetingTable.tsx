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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MEETING_STATUSES } from '@/constants'
import type { Meeting, User, Visitor, MeetingStatus } from '@/types'

const statusVariant: Record<MeetingStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  scheduled: 'outline',
  in_progress: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
}

type MeetingWithRelations = Meeting & {
  host: Pick<User, 'id' | 'name' | 'email' | 'department'> | null
  visitor: Pick<Visitor, 'id' | 'name' | 'company'> | null
}

interface MeetingTableProps {
  meetings: MeetingWithRelations[]
}

export default function MeetingTable({ meetings }: MeetingTableProps) {
  if (meetings.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-gray-500">
        등록된 미팅이 없습니다.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>제목</TableHead>
          <TableHead>담당자</TableHead>
          <TableHead>방문객</TableHead>
          <TableHead>예정 시간</TableHead>
          <TableHead>장소</TableHead>
          <TableHead>상태</TableHead>
          <TableHead className="text-right">관리</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {meetings.map((meeting) => (
          <TableRow key={meeting.id}>
            <TableCell className="font-medium">{meeting.title}</TableCell>
            <TableCell>{meeting.host?.name ?? '—'}</TableCell>
            <TableCell>{meeting.visitor?.name ?? '—'}</TableCell>
            <TableCell>
              {new Date(meeting.scheduled_at).toLocaleString('ko-KR', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </TableCell>
            <TableCell>{meeting.location ?? '—'}</TableCell>
            <TableCell>
              <Badge variant={statusVariant[meeting.status]}>
                {MEETING_STATUSES[meeting.status]}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/meetings/${meeting.id}`}>상세</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
