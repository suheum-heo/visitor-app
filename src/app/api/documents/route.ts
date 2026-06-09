import { auth } from '@/auth'
import sql from '@/lib/db'
import { hasPermission } from '@/lib/auth/rbac'
import { encryptFile } from '@/lib/storage/encrypt'
import { uploadFile, deleteFile, extractR2Key } from '@/lib/storage/r2'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/types'
import { randomUUID } from 'crypto'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
])

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const meetingId = new URL(request.url).searchParams.get('meeting_id')
    if (!meetingId) {
      return NextResponse.json({ error: 'meeting_id is required' }, { status: 400 })
    }

    const role = session.user.role as UserRole
    const canReadAll = hasPermission(role, 'meetings.read.all')
    const userId = session.user.id

    const [meeting] = await sql`
      SELECT host_id, created_by FROM meetings WHERE id = ${meetingId} AND deleted_at IS NULL
    `
    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })

    if (!canReadAll && meeting.host_id !== userId && meeting.created_by !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rows = await sql`
      SELECT d.*,
        json_build_object('id', u.id, 'name', u.name) as uploader
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.meeting_id = ${meetingId}
      ORDER BY d.created_at DESC
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
    const canUpdateAll = hasPermission(role, 'meetings.update.all')
    const canUpdateOwn = hasPermission(role, 'meetings.update.own')
    if (!canUpdateAll && !canUpdateOwn) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const meetingId = formData.get('meeting_id') as string | null
    const file = formData.get('file') as File | null

    if (!meetingId || !file) {
      return NextResponse.json({ error: 'meeting_id and file are required' }, { status: 400 })
    }

    const [meeting] = await sql`
      SELECT host_id, created_by FROM meetings WHERE id = ${meetingId} AND deleted_at IS NULL
    `
    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })

    if (!canUpdateAll && meeting.host_id !== session.user.id && meeting.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '파일 크기는 20MB 이하여야 합니다.' }, { status: 400 })
    }

    const mimeType = file.type || 'application/octet-stream'
    if (!ALLOWED_TYPES.has(mimeType)) {
      return NextResponse.json({ error: '지원하지 않는 파일 형식입니다.' }, { status: 400 })
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `documents/${meetingId}/${randomUUID()}-${safeName}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const { ciphertext, iv, authTag } = encryptFile(buffer)
    const publicUrl = await uploadFile(key, ciphertext, 'application/octet-stream')

    const [doc] = await sql`
      INSERT INTO documents (meeting_id, file_name, file_path, file_size, mime_type, iv, auth_tag, uploaded_by)
      VALUES (
        ${meetingId}, ${file.name}, ${publicUrl}, ${file.size}, ${mimeType},
        ${iv}, ${authTag}, ${session.user.id}
      )
      RETURNING *
    `

    return NextResponse.json({ data: doc }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const role = session.user.role as UserRole
    const canUpdateAll = hasPermission(role, 'meetings.update.all')
    const canUpdateOwn = hasPermission(role, 'meetings.update.own')
    if (!canUpdateAll && !canUpdateOwn) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [doc] = await sql`
      SELECT d.*, m.host_id, m.created_by as meeting_created_by
      FROM documents d
      JOIN meetings m ON d.meeting_id = m.id
      WHERE d.id = ${id}
    `
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!canUpdateAll && doc.host_id !== session.user.id && doc.meeting_created_by !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const key = extractR2Key(doc.file_path as string)
    if (key) {
      try {
        await deleteFile(key)
      } catch {
        // R2 delete failure should not block DB cleanup
      }
    }

    await sql`DELETE FROM documents WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
