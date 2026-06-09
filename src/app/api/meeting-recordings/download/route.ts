import { auth } from '@/auth'
import sql from '@/lib/db'
import { hasPermission } from '@/lib/auth/rbac'
import { logAudit } from '@/lib/audit'
import { isEncrypted } from '@/lib/storage/encrypt'
import { resolveFileContents } from '@/lib/storage/fileDelivery'
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

    const [recording] = await sql`
      SELECT mr.*, m.host_id, m.created_by as meeting_created_by, m.deleted_at as meeting_deleted_at
      FROM meeting_recordings mr
      JOIN meetings m ON mr.meeting_id = m.id
      WHERE mr.id = ${id}
    `
    if (!recording || recording.meeting_deleted_at) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (
      !canReadAll &&
      recording.host_id !== userId &&
      recording.meeting_created_by !== userId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await logAudit({
      userId: session.user.id,
      action: 'download',
      resourceType: 'meeting_recordings',
      resourceId: id,
      request,
      newData: {
        file_name: recording.file_name,
        meeting_id: recording.meeting_id,
      },
    })

    if (!isEncrypted(recording.iv, recording.auth_tag)) {
      return NextResponse.redirect(recording.file_path as string)
    }

    const contents = await resolveFileContents(
      recording.file_path as string,
      recording.iv as string,
      recording.auth_tag as string
    )

    return new NextResponse(new Uint8Array(contents), {
      headers: {
        'Content-Type': recording.mime_type as string,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(recording.file_name as string)}"`,
        'Content-Length': String(contents.length),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
