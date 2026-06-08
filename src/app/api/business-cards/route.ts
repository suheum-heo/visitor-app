import { auth } from '@/auth'
import sql from '@/lib/db'
import { hasPermission } from '@/lib/auth/rbac'
import { uploadFile } from '@/lib/storage/r2'
import { extractBusinessCardData } from '@/lib/ocr/businessCard'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/types'
import { randomUUID } from 'crypto'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const visitorId = searchParams.get('visitor_id')
    const meetingId = searchParams.get('meeting_id')

    const rows = await sql`
      SELECT * FROM business_cards
      WHERE (${visitorId ?? null}::uuid IS NULL OR visitor_id = ${visitorId ?? null}::uuid)
        AND (${meetingId ?? null}::uuid IS NULL OR meeting_id = ${meetingId ?? null}::uuid)
      ORDER BY created_at DESC
      LIMIT 50
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
    if (!hasPermission(role, 'visitors.create') && !hasPermission(role, 'meetings.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const contentType = request.headers.get('content-type') ?? ''

    // JSON body: save confirmed business card after user review
    if (contentType.includes('application/json')) {
      const body = await request.json() as {
        image_url: string
        name?: string | null
        company?: string | null
        position?: string | null
        phone?: string | null
        email?: string | null
        visitor_id?: string | null
        meeting_id?: string | null
        ocr_raw?: Record<string, unknown>
        confirmed?: boolean
      }

      if (!body.image_url || !body.confirmed) {
        return NextResponse.json(
          { error: 'image_url and confirmed=true are required to save' },
          { status: 400 }
        )
      }

      const [card] = await sql`
        INSERT INTO business_cards (
          image_url, name, company, position, phone, email,
          visitor_id, meeting_id, ocr_raw, is_confirmed, created_by
        )
        VALUES (
          ${body.image_url},
          ${body.name ?? null},
          ${body.company ?? null},
          ${body.position ?? null},
          ${body.phone ?? null},
          ${body.email ?? null},
          ${body.visitor_id ?? null},
          ${body.meeting_id ?? null},
          ${body.ocr_raw ? JSON.stringify(body.ocr_raw) : null},
          true,
          ${session.user.id}
        )
        RETURNING *
      `

      await sql`
        INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data)
        VALUES (${session.user.id}, 'create', 'business_cards', ${card.id}, ${JSON.stringify(card)})
      `

      return NextResponse.json({ data: card }, { status: 201 })
    }

    // Multipart: upload image + OCR (review before save)
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: '이미지 크기는 10MB 이하여야 합니다.' }, { status: 400 })
    }

    const mimeType = file.type || 'image/jpeg'
    if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
      return NextResponse.json({ error: '지원하지 않는 이미지 형식입니다.' }, { status: 400 })
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `business-cards/${randomUUID()}-${safeName}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const imageUrl = await uploadFile(key, buffer, mimeType)

    const base64 = buffer.toString('base64')
    const ocr = await extractBusinessCardData(base64, mimeType)

    return NextResponse.json({
      data: {
        image_url: imageUrl,
        name: ocr.name,
        company: ocr.company,
        position: ocr.position,
        phone: ocr.phone,
        email: ocr.email,
        ocr_raw: ocr.raw,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    if (message.includes('ANTHROPIC') || message.includes('Claude')) {
      return NextResponse.json({ error: message }, { status: 502 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
