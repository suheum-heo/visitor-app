import type { Permission, UserRole } from '@/types'
import { createClient } from '@/lib/supabase/server'

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'visitors.create',
    'visitors.read.all',
    'visitors.read.own',
    'visitors.update.all',
    'visitors.update.own',
    'visitors.delete',
    'meetings.create',
    'meetings.read.all',
    'meetings.read.own',
    'meetings.update.all',
    'meetings.update.own',
    'meetings.delete',
    'users.manage',
    'audit.read',
  ],
  manager: [
    'visitors.create',
    'visitors.read.all',
    'visitors.read.own',
    'visitors.update.all',
    'visitors.update.own',
    'visitors.delete',
    'meetings.create',
    'meetings.read.all',
    'meetings.read.own',
    'meetings.update.all',
    'meetings.update.own',
    'meetings.delete',
    'audit.read',
  ],
  staff: [
    'visitors.create',
    'visitors.read.own',
    'visitors.update.own',
    'meetings.create',
    'meetings.read.own',
    'meetings.update.own',
  ],
  security: [
    'visitors.create',
    'visitors.read.all',
    'visitors.read.own',
    'visitors.update.all',
    'visitors.update.own',
  ],
  guest: [],
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data.role as UserRole
}

export async function checkPermission(
  userId: string,
  permission: Permission
): Promise<boolean> {
  const role = await getUserRole(userId)
  if (!role) return false
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}
