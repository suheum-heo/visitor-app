import { auth } from '@/auth'
import sql from '@/lib/db'
import { hasPermission } from '@/lib/auth/rbac'
import {
  isLikelyDuplicate,
  scoreVisitorDuplicate,
  type ScoredVisitorMatch,
} from '@/lib/visitors/similarity'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = session.user.role as UserRole
    if (!hasPermission(role, 'visitors.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')?.trim() ?? ''
    const company = searchParams.get('company')?.trim() ?? ''
    const excludeId = searchParams.get('exclude_id')

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const namePattern = `%${name}%`
    const companyPattern = company ? `%${company}%` : null

    const candidates = await sql<
      {
        id: string
        name: string
        company: string | null
        email: string | null
        phone: string | null
        status: string
        scheduled_at: string | null
      }[]
    >`
      SELECT id, name, company, email, phone, status, scheduled_at
      FROM visitors
      WHERE deleted_at IS NULL
        AND (${excludeId ?? null}::uuid IS NULL OR id <> ${excludeId ?? null}::uuid)
        AND (
          name ILIKE ${namePattern}
          OR ${namePattern} ILIKE '%' || name || '%'
          OR ${companyPattern}::text IS NOT NULL AND company ILIKE ${companyPattern}
          OR (
            ${companyPattern}::text IS NOT NULL
            AND company IS NOT NULL
            AND ${companyPattern} ILIKE '%' || company || '%'
          )
        )
      ORDER BY created_at DESC
      LIMIT 50
    `

    const matches: ScoredVisitorMatch[] = candidates
      .map((candidate) => ({
        ...candidate,
        similarity: scoreVisitorDuplicate({ name, company: company || null }, candidate),
      }))
      .filter((m) => isLikelyDuplicate(m.similarity))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10)

    return NextResponse.json({ data: matches, hasDuplicates: matches.length > 0 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
