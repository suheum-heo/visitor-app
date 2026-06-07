import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkPermission } from '@/lib/auth/rbac'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('visitors')
      .select(`*, host:host_id(id, name, email, department), creator:created_by(id, name)`)
      .eq('id', id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const canUpdateAll = await checkPermission(user.id, 'visitors.update.all')
    const canUpdateOwn = await checkPermission(user.id, 'visitors.update.own')
    if (!canUpdateAll && !canUpdateOwn) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { data: existing } = await supabase
      .from('visitors').select('*').eq('id', id).single()

    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!canUpdateAll && (existing.host_id !== user.id && existing.created_by !== user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('visitors')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const serviceClient = await createServiceClient()
    await serviceClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'update',
      table_name: 'visitors',
      record_id: id,
      old_data: existing,
      new_data: data,
    })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const allowed = await checkPermission(user.id, 'visitors.delete')
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: existing } = await supabase
      .from('visitors').select('*').eq('id', id).single()

    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { error } = await supabase.from('visitors').delete().eq('id', id)
    if (error) throw error

    const serviceClient = await createServiceClient()
    await serviceClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'delete',
      table_name: 'visitors',
      record_id: id,
      old_data: existing,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
