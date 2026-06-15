import type { Permission, UserRole } from '@/types'

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'visitors.create', 'visitors.read.all', 'visitors.read.own',
    'visitors.update.all', 'visitors.update.own', 'visitors.delete',
    'meetings.create', 'meetings.read.all', 'meetings.read.own',
    'meetings.update.all', 'meetings.update.own', 'meetings.delete',
    'trips.create', 'trips.read.all', 'trips.read.own',
    'trips.update.all', 'trips.update.own', 'trips.delete',
    'projects.create', 'projects.read',
    'users.manage', 'audit.read',
    'access.read', 'access.create', 'access.sync',
    'reports.read',
  ],
  manager: [
    'visitors.create', 'visitors.read.all', 'visitors.read.own',
    'visitors.update.all', 'visitors.update.own', 'visitors.delete',
    'meetings.create', 'meetings.read.all', 'meetings.read.own',
    'meetings.update.all', 'meetings.update.own', 'meetings.delete',
    'trips.create', 'trips.read.all', 'trips.read.own',
    'trips.update.all', 'trips.update.own', 'trips.delete',
    'projects.create', 'projects.read',
    'audit.read',
    'access.read',
    'reports.read',
  ],
  staff: [
    'visitors.create', 'visitors.read.own', 'visitors.update.own',
    'meetings.create', 'meetings.read.own', 'meetings.update.own',
    'trips.create', 'trips.read.own', 'trips.update.own',
    'projects.read',
  ],
  security: [
    'visitors.create', 'visitors.read.all', 'visitors.read.own',
    'visitors.update.all', 'visitors.update.own',
    'access.read', 'access.create', 'access.sync',
    'projects.read',
  ],
  guest: [],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export { ROLE_PERMISSIONS }
