import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TRIP_STATUSES } from '@/constants'
import type { BusinessTrip, TripStatus, User } from '@/types'

interface BusinessTripTableProps {
  trips: (BusinessTrip & {
    employee: Pick<User, 'id' | 'name' | 'email' | 'department'> | null
  })[]
}

export default function BusinessTripTable({ trips }: BusinessTripTableProps) {
  if (trips.length === 0) {
    return <p className="text-sm text-gray-500 p-6">등록된 출장이 없습니다.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>제목</TableHead>
          <TableHead>출장자</TableHead>
          <TableHead>방문 회사</TableHead>
          <TableHead>출발 일시</TableHead>
          <TableHead>상태</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trips.map((trip) => (
          <TableRow key={trip.id}>
            <TableCell>
              <Link href={`/trips/${trip.id}`} className="font-medium text-blue-600 hover:underline">
                {trip.title}
              </Link>
            </TableCell>
            <TableCell>{trip.employee?.name ?? '—'}</TableCell>
            <TableCell>{trip.company ?? trip.location ?? '—'}</TableCell>
            <TableCell className="whitespace-nowrap">
              {new Date(trip.scheduled_at).toLocaleString('ko-KR')}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{TRIP_STATUSES[trip.status as TripStatus]}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
