import { auth } from '@/auth'
import sql from '@/lib/db'
import { hasPermission } from '@/lib/auth/rbac'
import { logAudit } from '@/lib/audit'
import { parseTags } from '@/lib/tags'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = session.user.role as UserRole
    if (!hasPermission(role, 'projects.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const rows = await sql`
      SELECT id, name, company, description, tags, created_at
      FROM projects
      WHERE deleted_at IS NULL
        AND (${search ?? null}::text IS NULL OR
          name ILIKE ${'%' + (search ?? '') + '%'} OR
          company ILIKE ${'%' + (search ?? '') + '%'}
        )
      ORDER BY name
      LIMIT 100
    `

    return NextResponse.json({ data: rows })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = session.user.role as UserRole
    if (!hasPermission(role, 'projects.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, company, description } = body
    const tags = parseTags(body.tags)

    if (!name?.trim()) {
      return NextResponse.json({ error: '프로젝트명은 필수입니다.' }, { status: 400 })
    }

    const [project] = await sql`
      INSERT INTO projects (name, company, description, tags, created_by)
      VALUES (${name.trim()}, ${company ?? null}, ${description ?? null}, ${tags}, ${session.user.id})
      RETURNING *
    `

    await logAudit({
      userId: session.user.id,
      action: 'create',
      resourceType: 'projects',
      resourceId: project.id,
      request,
      newData: project as Record<string, unknown>,
    })

    return NextResponse.json({ data: project }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
