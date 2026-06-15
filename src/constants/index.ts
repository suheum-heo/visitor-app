import type { UserRole, VisitorPurpose, VisitorStatus, MeetingStatus, MeetingType, TripStatus, AccessDirection, AccessSource, AccessRecordCategory } from '@/types'

export const ROLES: Record<UserRole, string> = {
  admin: '관리자',
  manager: '매니저',
  staff: '직원',
  security: '경비',
  guest: '게스트',
}

export const VISITOR_PURPOSES: Record<VisitorPurpose, string> = {
  meeting: '미팅',
  delivery: '배송',
  interview: '면접',
  tour: '견학',
  other: '기타',
}

export const VISITOR_STATUSES: Record<VisitorStatus, string> = {
  scheduled: '예정',
  arrived: '입장',
  departed: '퇴장',
  cancelled: '취소',
}

export const MEETING_STATUSES: Record<MeetingStatus, string> = {
  scheduled: '예정',
  in_progress: '진행 중',
  completed: '완료',
  cancelled: '취소',
}

export const MEETING_TYPES: Record<MeetingType, string> = {
  internal: '사내 회의',
  external_inbound: '외부 방문 미팅',
  external_outbound: '외부 출장 미팅',
  virtual: '화상 회의',
}

export const TRIP_STATUSES: Record<TripStatus, string> = {
  scheduled: '예정',
  in_progress: '진행 중',
  completed: '완료',
  cancelled: '취소',
}

export const ACCESS_DIRECTIONS: Record<AccessDirection, string> = {
  in: '입장',
  out: '퇴장',
}

export const ACCESS_SOURCES: Record<AccessSource, string> = {
  manual: '수동',
  sync: '동기화',
  api: 'API',
}

export const ACCESS_RECORD_CATEGORIES: Record<AccessRecordCategory, string> = {
  person: '방문자',
  vehicle: '차량',
  delivery: '납품',
}

export const TIMELINE_TYPE_LABELS: Record<string, string> = {
  visitor: '방문',
  meeting: '미팅',
  trip: '출장',
  access: '출입',
}
