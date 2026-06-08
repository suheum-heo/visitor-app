import sql from '@/lib/db'
import { sendEmail } from '@/lib/email/resend'
import type { AccessRecord } from '@/types'

const ONE_HOUR_MS = 60 * 60 * 1000

export interface AccessAnomaly {
  type: 'unregistered_visitor' | 'schedule_mismatch'
  message: string
  meetingId?: string
  meetingTitle?: string
  scheduledAt?: string
  diffMinutes?: number
}

export async function detectAccessAnomalies(
  record: Pick<AccessRecord, 'id' | 'name' | 'company' | 'direction' | 'recorded_at' | 'visitor_id' | 'access_point'>
): Promise<AccessAnomaly[]> {
  const anomalies: AccessAnomaly[] = []

  if (!record.visitor_id) {
    anomalies.push({
      type: 'unregistered_visitor',
      message: `등록되지 않은 방문객 출입: ${record.name}${record.company ? ` (${record.company})` : ''}`,
    })
  }

  if (record.direction === 'in' && record.visitor_id) {
    const meetings = await sql<
      { id: string; title: string; scheduled_at: string }[]
    >`
      SELECT id, title, scheduled_at
      FROM meetings
      WHERE visitor_id = ${record.visitor_id}
        AND deleted_at IS NULL
        AND status IN ('scheduled', 'in_progress')
        AND scheduled_at BETWEEN ${new Date(new Date(record.recorded_at).getTime() - 24 * ONE_HOUR_MS).toISOString()}::timestamptz
          AND ${new Date(new Date(record.recorded_at).getTime() + 24 * ONE_HOUR_MS).toISOString()}::timestamptz
      ORDER BY abs(extract(epoch from (scheduled_at - ${record.recorded_at}::timestamptz)))
      LIMIT 1
    `

    const meeting = meetings[0]
    if (meeting) {
      const diffMs = Math.abs(
        new Date(record.recorded_at).getTime() - new Date(meeting.scheduled_at).getTime()
      )
      if (diffMs > ONE_HOUR_MS) {
        const diffMinutes = Math.round(diffMs / 60000)
        anomalies.push({
          type: 'schedule_mismatch',
          message: `미팅 예정 시간과 입장 시간 차이 ${diffMinutes}분: ${meeting.title}`,
          meetingId: meeting.id,
          meetingTitle: meeting.title,
          scheduledAt: meeting.scheduled_at,
          diffMinutes,
        })
      }
    }
  }

  return anomalies
}

export async function notifyAdminsOfAccessAnomalies(
  record: Pick<AccessRecord, 'id' | 'name' | 'company' | 'direction' | 'recorded_at' | 'visitor_id' | 'access_point'>,
  anomalies: AccessAnomaly[]
): Promise<void> {
  if (anomalies.length === 0) return

  const admins = await sql<{ email: string; name: string | null }[]>`
    SELECT email, name FROM users
    WHERE role = 'admin' AND is_active = true AND email IS NOT NULL
  `

  const recipients = admins.map((a) => a.email).filter(Boolean)
  if (recipients.length === 0) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const recordedAt = new Date(record.recorded_at).toLocaleString('ko-KR')
  const items = anomalies
    .map((a) => `<li>${a.message}</li>`)
    .join('')

  await sendEmail({
    to: recipients,
    subject: `[visitor-app] 출입 이상 감지: ${record.name}`,
    html: `
      <h2>출입 이상 감지 알림</h2>
      <p><strong>이름:</strong> ${record.name}</p>
      <p><strong>회사:</strong> ${record.company ?? '—'}</p>
      <p><strong>방향:</strong> ${record.direction === 'in' ? '입장' : '퇴장'}</p>
      <p><strong>시간:</strong> ${recordedAt}</p>
      <p><strong>출입구:</strong> ${record.access_point ?? '—'}</p>
      <ul>${items}</ul>
      <p><a href="${appUrl}/access-records">출입 기록 보기</a></p>
    `,
  })
}

export async function handleAccessRecordAnomalies(
  record: Pick<AccessRecord, 'id' | 'name' | 'company' | 'direction' | 'recorded_at' | 'visitor_id' | 'access_point'>
): Promise<AccessAnomaly[]> {
  const anomalies = await detectAccessAnomalies(record)
  if (anomalies.length > 0) {
    try {
      await notifyAdminsOfAccessAnomalies(record, anomalies)
    } catch (err) {
      console.error('Failed to send access anomaly alert:', err)
    }
  }
  return anomalies
}
