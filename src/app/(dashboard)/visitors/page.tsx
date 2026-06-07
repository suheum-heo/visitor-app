import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import VisitorTable from '@/components/visitors/VisitorTable'
import VisitorFilters from './VisitorFilters'
import type { Visitor, User } from '@/types'

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}

export default async function VisitorsPage({ searchParams }: PageProps) {
  const { status, search, page = '1' } = await searchParams
  const supabase = await createClient()

  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (search) params.set('search', search)
  params.set('page', page)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/visitors?${params}`, {
    headers: { Cookie: '' },
    cache: 'no-store',
  })

  // 서버 컴포넌트에서 직접 Supabase 쿼리
  const currentPage = parseInt(page)
  const limit = 20
  const offset = (currentPage - 1) * limit

  let query = supabase
    .from('visitors')
    .select(`*, host:host_id(id, name, email, department), creator:created_by(id, name)`, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (search) query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%`)

  const { data: visitors, count } = await query

  const totalPages = Math.ceil((count ?? 0) / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">방문객 관리</h1>
          <p className="text-sm text-gray-500 mt-1">총 {count ?? 0}명</p>
        </div>
        <Button asChild>
          <Link href="/visitors/new">방문객 등록</Link>
        </Button>
      </div>

      <VisitorFilters currentStatus={status} currentSearch={search} />

      <div className="bg-white rounded-lg border border-gray-200">
        <VisitorTable
          visitors={(visitors as unknown as (Visitor & { host: Pick<User, 'id' | 'name' | 'email' | 'department'> | null })[]) ?? []}
        />
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === currentPage ? 'default' : 'outline'}
              size="sm"
              asChild
            >
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
