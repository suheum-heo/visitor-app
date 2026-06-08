import type { Permission, UserRole } from '@/types'
import sql from '@/lib/db'

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'visitors.create', 'visitors.read.all', 'visitors.read.own',
    'visitors.update.all', 'visitors.update.own', 'visitors.delete',
    'meetings.create', 'meetings.read.all', 'meetings.read.own',
    'meetings.update.all', 'meetings.update.own', 'meetings.delete',
    'users.manage', 'audit.read',
    'access.read', 'access.create', 'access.sync',
  ],
  manager: [
    'visitors.create', 'visitors.read.all', 'visitors.read.own',
    'visitors.update.all', 'visitors.update.own', 'visitors.delete',
    'meetings.create', 'meetings.read.all', 'meetings.read.own',
    'meetings.update.all', 'meetings.update.own', 'meetings.delete',
    'audit.read',
    'access.read',
  ],
  staff: [
    'visitors.create', 'visitors.read.own', 'visitors.update.own',
    'meetings.create', 'meetings.read.own', 'meetings.update.own',
  ],
  security: [
    'visitors.create', 'visitors.read.all', 'visitors.read.own',
    'visitors.update.all', 'visitors.update.own',
    'access.read', 'access.create', 'access.sync',
  ],
  guest: [],
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const [user] = await sql<{ role: string }[]>`
    SELECT role FROM users WHERE id = ${userId} AND is_active = true
  `
  return (user?.role as UserRole) ?? null
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
