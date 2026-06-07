import { Badge } from '@/components/ui/badge'
import { VISITOR_STATUSES } from '@/constants'
import type { VisitorStatus } from '@/types'

const variantMap: Record<VisitorStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  scheduled: 'outline',
  arrived: 'default',
  departed: 'secondary',
  cancelled: 'destructive',
}

export default function VisitorStatusBadge({ status }: { status: VisitorStatus }) {
  return (
    <Badge variant={variantMap[status]}>
      {VISITOR_STATUSES[status]}
    </Badge>
  )
}
