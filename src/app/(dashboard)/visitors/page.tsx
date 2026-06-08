import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import { hasPermission } from '@/lib/auth/rbac'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import VisitorTable from '@/components/visitors/VisitorTable'
import VisitorFilters from './VisitorFilters'
import type { Visitor, User, UserRole } from '@/types'

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}

export default async function VisitorsPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { status, search, page = '1' } = await searchParams
  const currentPage = parseInt(page)
  const limit = 20
  const offset = (currentPage - 1) * limit

  const role = session.user.role as UserRole
  const canReadAll = hasPermission(role, 'visitors.read.all')
  const userId = session.user.id

  const visitors = await sql`
    SELECT v.*,
      json_build_object('id', u1.id, 'name', u1.name, 'email', u1.email, 'department', u1.department) as host,
      json_build_object('id', u2.id, 'name', u2.name) as creator
    FROM visitors v
    LEFT JOIN users u1 ON v.host_id = u1.id
    LEFT JOIN users u2 ON v.created_by = u2.id
    WHERE
      v.deleted_at IS NULL
      AND (${!canReadAll} = false OR (v.host_id = ${userId} OR v.created_by = ${userId}))
      AND (${status ?? null}::text IS NULL OR v.status = ${status ?? null}::text)
      AND (
        ${search ?? null}::text IS NULL OR
        v.name ILIKE ${'%' + (search ?? '') + '%'} OR
        v.company ILIKE ${'%' + (search ?? '') + '%'}
      )
    ORDER BY v.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  const [{ count }] = await sql<{ count: string }[]>`
    SELECT COUNT(*)::text as count FROM visitors v
    WHERE
      v.deleted_at IS NULL
      AND (${!canReadAll} = false OR (v.host_id = ${userId} OR v.created_by = ${userId}))
      AND (${status ?? null}::text IS NULL OR v.status = ${status ?? null}::text)
      AND (
        ${search ?? null}::text IS NULL OR
        v.name ILIKE ${'%' + (search ?? '') + '%'} OR
        v.company ILIKE ${'%' + (search ?? '') + '%'}
      )
  `

  const total = parseInt(count)
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">방문객 관리</h1>
          <p className="text-sm text-gray-500 mt-1">총 {total}명</p>
        </div>
        <Button asChild>
          <Link href="/visitors/new">방문객 등록</Link>
        </Button>
      </div>

      <VisitorFilters currentStatus={status} currentSearch={search} />

      <div className="bg-white rounded-lg border border-gray-200">
        <VisitorTable
          visitors={visitors as unknown as (Visitor & { host: Pick<User, 'id' | 'name' | 'email' | 'department'> | null })[]}
        />
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button key={p} variant={p === currentPage ? 'default' : 'outline'} size="sm" asChild>
              <Link href={`/visitors?page=${p}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}>
                {p}
              </Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
