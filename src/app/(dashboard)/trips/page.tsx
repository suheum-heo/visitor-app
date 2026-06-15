import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import { hasPermission } from '@/lib/auth/rbac'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import BusinessTripTable from '@/components/trips/BusinessTripTable'
import type { BusinessTrip, User, UserRole } from '@/types'

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string }>
}

export default async function TripsPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const role = session.user.role as UserRole
  if (!hasPermission(role, 'trips.read.own') && !hasPermission(role, 'trips.read.all')) {
    redirect('/')
  }

  const { search, page = '1' } = await searchParams
  const currentPage = parseInt(page)
  const limit = 20
  const offset = (currentPage - 1) * limit

  const canReadAll = hasPermission(role, 'trips.read.all')
  const userId = session.user.id

  const trips = await sql`
    SELECT bt.*,
      json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'department', u.department) as employee
    FROM business_trips bt
    LEFT JOIN users u ON bt.employee_id = u.id
    WHERE
      bt.deleted_at IS NULL
      AND (${!canReadAll} = false OR (bt.employee_id = ${userId} OR bt.created_by = ${userId}))
      AND (
        ${search ?? null}::text IS NULL OR
        bt.title ILIKE ${'%' + (search ?? '') + '%'} OR
        bt.company ILIKE ${'%' + (search ?? '') + '%'}
      )
    ORDER BY bt.scheduled_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  const [{ count }] = await sql<{ count: string }[]>`
    SELECT COUNT(*)::text as count FROM business_trips bt
    WHERE
      bt.deleted_at IS NULL
      AND (${!canReadAll} = false OR (bt.employee_id = ${userId} OR bt.created_by = ${userId}))
      AND (
        ${search ?? null}::text IS NULL OR
        bt.title ILIKE ${'%' + (search ?? '') + '%'} OR
        bt.company ILIKE ${'%' + (search ?? '') + '%'}
      )
  `

  const total = parseInt(count)
  const totalPages = Math.ceil(total / limit)
  const canCreate = hasPermission(role, 'trips.create')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">출장 관리</h1>
          <p className="text-sm text-gray-500 mt-1">직원 출장 기록 · 총 {total}건</p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/trips/new">출장 등록</Link>
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <BusinessTripTable
          trips={trips as unknown as (BusinessTrip & {
            employee: Pick<User, 'id' | 'name' | 'email' | 'department'> | null
          })[]}
        />
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button key={p} variant={p === currentPage ? 'default' : 'outline'} size="sm" asChild>
              <Link href={`/trips?page=${p}`}>{p}</Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
