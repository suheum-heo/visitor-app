import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import { hasPermission } from '@/lib/auth/rbac'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import MeetingTable from '@/components/meetings/MeetingTable'
import type { Meeting, User, Visitor, UserRole } from '@/types'

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}

export default async function MeetingsPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { status, search, page = '1' } = await searchParams
  const currentPage = parseInt(page)
  const limit = 20
  const offset = (currentPage - 1) * limit

  const role = session.user.role as UserRole
  const canReadAll = hasPermission(role, 'meetings.read.all')
  const userId = session.user.id

  const meetings = await sql`
    SELECT m.*,
      json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'department', u.department) as host,
      CASE WHEN v.id IS NOT NULL
        THEN json_build_object('id', v.id, 'name', v.name, 'company', v.company)
        ELSE null END as visitor
    FROM meetings m
    LEFT JOIN users u ON m.host_id = u.id
    LEFT JOIN visitors v ON m.visitor_id = v.id
    WHERE
      (${!canReadAll} = false OR (m.host_id = ${userId} OR m.created_by = ${userId}))
      AND (${status ?? null}::text IS NULL OR m.status = ${status ?? null}::text)
      AND (${search ?? null}::text IS NULL OR m.title ILIKE ${'%' + (search ?? '') + '%'})
    ORDER BY m.scheduled_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  const [{ count }] = await sql<{ count: string }[]>`
    SELECT COUNT(*)::text as count FROM meetings m
    WHERE
      (${!canReadAll} = false OR (m.host_id = ${userId} OR m.created_by = ${userId}))
      AND (${status ?? null}::text IS NULL OR m.status = ${status ?? null}::text)
      AND (${search ?? null}::text IS NULL OR m.title ILIKE ${'%' + (search ?? '') + '%'})
  `

  const total = parseInt(count)
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">미팅 관리</h1>
          <p className="text-sm text-gray-500 mt-1">총 {total}건</p>
        </div>
        <Button asChild>
          <Link href="/meetings/new">미팅 등록</Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <MeetingTable
          meetings={meetings as unknown as (Meeting & {
            host: Pick<User, 'id' | 'name' | 'email' | 'department'> | null
            visitor: Pick<Visitor, 'id' | 'name' | 'company'> | null
          })[]}
        />
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button key={p} variant={p === currentPage ? 'default' : 'outline'} size="sm" asChild>
              <Link href={`/meetings?page=${p}${status ? `&status=${status}` : ''}`}>{p}</Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
