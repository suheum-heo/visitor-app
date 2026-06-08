import { auth } from '@/auth'
import sql from '@/lib/db'
import { hasPermission } from '@/lib/auth/rbac'
import { logAudit } from '@/lib/audit'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const role = session.user.role as UserRole
    const canReadAll = hasPermission(role, 'meetings.read.all')
    const userId = session.user.id

    const [doc] = await sql`
      SELECT d.*, m.host_id, m.created_by as meeting_created_by, m.deleted_at as meeting_deleted_at
      FROM documents d
      JOIN meetings m ON d.meeting_id = m.id
      WHERE d.id = ${id}
    `
    if (!doc || doc.meeting_deleted_at) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (!canReadAll && doc.host_id !== userId && doc.meeting_created_by !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await logAudit({
      userId: session.user.id,
      action: 'download',
      resourceType: 'documents',
      resourceId: id,
      request,
      newData: {
        file_name: doc.file_name,
        meeting_id: doc.meeting_id,
      },
    })

    return NextResponse.redirect(doc.file_path as string)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
