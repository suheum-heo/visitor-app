import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkPermission } from '@/lib/auth/rbac'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const offset = (page - 1) * limit

    let query = supabase
      .from('visitors')
      .select(`
        *,
        host:host_id(id, name, email, department),
        creator:created_by(id, name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)
    if (search) query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%`)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({ data, count, page, limit })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const allowed = await checkPermission(user.id, 'visitors.create')
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { name, company, phone, email, purpose, host_id, scheduled_at, notes } = body

    if (!name || !purpose || !host_id) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('visitors')
      .insert({
        name, company, phone, email, purpose,
        host_id, scheduled_at, notes,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    // 감사 로그
    const serviceClient = await createServiceClient()
    await serviceClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'create',
      table_name: 'visitors',
      record_id: data.id,
      new_data: data,
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
