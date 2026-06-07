import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import MeetingTable from '@/components/meetings/MeetingTable'
import type { Meeting, User, Visitor } from '@/types'

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}

export default async function MeetingsPage({ searchParams }: PageProps) {
  const { status, search, page = '1' } = await searchParams
  const supabase = await createClient()

  const currentPage = parseInt(page)
  const limit = 20
  const offset = (currentPage - 1) * limit

  let query = supabase
    .from('meetings')
    .select(`*, host:host_id(id, name, email, department), visitor:visitor_id(id, name, company)`, { count: 'exact' })
    .order('scheduled_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (search) query = query.ilike('title', `%${search}%`)

  const { data: meetings, count } = await query

  const totalPages = Math.ceil((count ?? 0) / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">미팅 관리</h1>
          <p className="text-sm text-gray-500 mt-1">총 {count ?? 0}건</p>
        </div>
        <Button asChild>
          <Link href="/meetings/new">미팅 등록</Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <MeetingTable
          meetings={(meetings as unknown as (Meeting & {
            host: Pick<User, 'id' | 'name' | 'email' | 'department'> | null
            visitor: Pick<Visitor, 'id' | 'name' | 'company'> | null
          })[]) ?? []}
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
              <Link href={`/meetings?page=${p}${status ? `&status=${status}` : ''}`}>{p}</Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
