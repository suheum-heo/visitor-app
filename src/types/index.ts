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
  tags: string[]
  deleted_at: string | null
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
  zoom_link: string | null
  tags: string[]
  deleted_at: string | null
  created_by: string
  created_at: string
  updated_at: string
  host?: Pick<User, 'id' | 'name' | 'email' | 'department'>
  visitor?: Pick<Visitor, 'id' | 'name' | 'company'>
}

export type TranscriptionStatus = 'pending' | 'processing' | 'done'

export interface MeetingRecording {
  id: string
  meeting_id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  transcription_status: TranscriptionStatus
  transcription_text: string | null
  uploaded_by: string
  created_at: string
  updated_at: string
}

export interface ReportMonthCount {
  month: string
  count: number
}

export interface ReportCompanyCount {
  company: string
  count: number
}

export interface ReportHourCount {
  hour: number
  count: number
}

export interface ReportStats {
  visitors_by_month: ReportMonthCount[]
  visitors_by_company: ReportCompanyCount[]
  meetings_by_month: ReportMonthCount[]
  peak_visit_hours: ReportHourCount[]
}

export interface BusinessCard {
  id: string
  visitor_id: string | null
  meeting_id: string | null
  image_url: string
  name: string | null
  company: string | null
  position: string | null
  phone: string | null
  email: string | null
  ocr_raw: Record<string, unknown> | null
  is_confirmed: boolean
  created_by: string
  created_at: string
  updated_at: string
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
  resource_type: string
  resource_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export type AccessDirection = 'in' | 'out'
export type AccessSource = 'manual' | 'sync' | 'api'
export type SyncStatus = 'success' | 'failed' | 'partial'

export interface AccessRecord {
  id: string
  visitor_id: string | null
  name: string
  company: string | null
  direction: AccessDirection
  access_point: string | null
  recorded_at: string
  source: AccessSource
  external_id: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  visitor?: Pick<Visitor, 'id' | 'name' | 'company'>
}

export interface SyncLog {
  id: string
  sync_type: string
  status: SyncStatus
  records_fetched: number
  records_created: number
  records_updated: number
  error_message: string | null
  started_at: string
  completed_at: string | null
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
  | 'access.read'
  | 'access.create'
  | 'access.sync'
  | 'reports.read'
