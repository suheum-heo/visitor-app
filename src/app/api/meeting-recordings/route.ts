import { auth } from '@/auth'
import sql from '@/lib/db'
import { hasPermission } from '@/lib/auth/rbac'
import { uploadFile } from '@/lib/storage/r2'
import { transcribeRecording } from '@/lib/transcription/whisper'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/types'
import { randomUUID } from 'crypto'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB
const ALLOWED_TYPES = new Set([
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'video/mp4',
  'video/webm',
  'video/quicktime',
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

    const [meeting] = await sql`SELECT host_id, created_by FROM meetings WHERE id = ${meetingId}`
    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })

    if (!canReadAll && meeting.host_id !== userId && meeting.created_by !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rows = await sql`
      SELECT * FROM meeting_recordings
      WHERE meeting_id = ${meetingId}
      ORDER BY created_at DESC
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

    const [meeting] = await sql`SELECT host_id, created_by FROM meetings WHERE id = ${meetingId}`
    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })

    if (!canUpdateAll && meeting.host_id !== session.user.id && meeting.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '파일 크기는 100MB 이하여야 합니다.' }, { status: 400 })
    }

    const mimeType = file.type || 'application/octet-stream'
    if (!ALLOWED_TYPES.has(mimeType)) {
      return NextResponse.json({ error: '지원하지 않는 오디오/영상 형식입니다.' }, { status: 400 })
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `recordings/${meetingId}/${randomUUID()}-${safeName}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const publicUrl = await uploadFile(key, buffer, mimeType)

    const [recording] = await sql`
      INSERT INTO meeting_recordings (
        meeting_id, file_name, file_path, file_size, mime_type,
        transcription_status, uploaded_by
      )
      VALUES (
        ${meetingId}, ${file.name}, ${publicUrl}, ${file.size}, ${mimeType},
        'pending', ${session.user.id}
      )
      RETURNING *
    `

    await sql`
      INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data)
      VALUES (${session.user.id}, 'create', 'meeting_recordings', ${recording.id}, ${JSON.stringify(recording)})
    `

    // Stub: 전사 작업 시작 (실제 Whisper API 연동 전까지 processing 상태만 설정)
    await sql`
      UPDATE meeting_recordings
      SET transcription_status = 'processing', updated_at = now()
      WHERE id = ${recording.id}
    `

    try {
      await transcribeRecording(publicUrl, mimeType)
      // TODO: Whisper API 연동 후 transcription_text 저장 및 status = 'done'
    } catch {
      // Stub 단계에서는 pending으로 유지 (Whisper 미구현)
      await sql`
        UPDATE meeting_recordings
        SET transcription_status = 'pending', updated_at = now()
        WHERE id = ${recording.id}
      `
    }

    const [updated] = await sql`
      SELECT * FROM meeting_recordings WHERE id = ${recording.id}
    `

    return NextResponse.json({ data: updated }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
