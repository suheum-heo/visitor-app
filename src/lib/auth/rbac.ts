import type { Permission, UserRole } from '@/types'
import sql from '@/lib/db'
import { hasPermission, ROLE_PERMISSIONS } from '@/lib/auth/permissions'

export { hasPermission } from '@/lib/auth/permissions'

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
