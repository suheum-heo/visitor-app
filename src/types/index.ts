export type UserRole = 'admin' | 'manager' | 'staff' | 'security' | 'guest'

export type VisitorPurpose = 'meeting' | 'delivery' | 'interview' | 'tour' | 'other'
export type VisitorStatus = 'scheduled' | 'arrived' | 'departed' | 'cancelled'

export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

export interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  role: UserRole
  department: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Visitor {
  id: string
  name: string
  company: string | null
  phone: string | null
  email: string | null
  purpose: VisitorPurpose
  host_id: string
  status: VisitorStatus
  scheduled_at: string | null
  arrived_at: string | null
  departed_at: string | null
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
  host?: Pick<User, 'id' | 'name' | 'email' | 'department'>
  creator?: Pick<User, 'id' | 'name'>
}

export interface Meeting {
  id: string
  title: string
  description: string | null
  host_id: string
  visitor_id: string | null
  location: string | null
  scheduled_at: string
  duration_minutes: number
  status: MeetingStatus
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
  host?: Pick<User, 'id' | 'name' | 'email' | 'department'>
  visitor?: Pick<Visitor, 'id' | 'name' | 'company'>
}

export interface Document {
  id: string
  meeting_id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  uploaded_by: string
  created_at: string
  updated_at: string
  uploader?: Pick<User, 'id' | 'name'>
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  table_name: string
  record_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  created_at: string
}

export type Permission =
  | 'visitors.create'
  | 'visitors.read.all'
  | 'visitors.read.own'
  | 'visitors.update.all'
  | 'visitors.update.own'
  | 'visitors.delete'
  | 'meetings.create'
  | 'meetings.read.all'
  | 'meetings.read.own'
  | 'meetings.update.all'
  | 'meetings.update.own'
  | 'meetings.delete'
  | 'users.manage'
  | 'audit.read'
