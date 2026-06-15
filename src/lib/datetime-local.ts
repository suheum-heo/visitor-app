/**
 * datetime-local input helpers.
 * Use split date + time inputs (24h) in UI; never use toISOString().slice(0, 16).
 */

const DATETIME_LOCAL_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
const PARTIAL_TIME_RE = /^\d{0,2}(:\d{0,2})?$/

/** 입력 중 허용되는 부분 시간 문자열 (정규화 없음) */
export function formatTimeInput(raw: string): string {
  const cleaned = raw.replace(/[^\d:]/g, '')
  const colonIndex = cleaned.indexOf(':')

  if (colonIndex < 0) {
    const digits = cleaned.slice(0, 4)
    if (digits.length <= 2) return digits
    return `${digits.slice(0, 2)}:${digits.slice(2)}`
  }

  const hour = cleaned.slice(0, colonIndex).slice(0, 2)
  const afterColon = cleaned.slice(colonIndex + 1).replace(/:/g, '')

  if (afterColon.length === 0 && cleaned.endsWith(':')) return `${hour}:`

  const minute =
    afterColon.length > 2 ? afterColon.slice(-2) : afterColon
  return `${hour}:${minute}`
}

export function normalizeTimeInput(time: string): string {
  const trimmed = time.trim()
  if (!trimmed) return ''

  const colonMatch = trimmed.match(/^(\d{1,2}):(\d{1,2})$/)
  if (colonMatch) {
    const hour = Math.min(23, Math.max(0, parseInt(colonMatch[1], 10)))
    const minute = Math.min(59, Math.max(0, parseInt(colonMatch[2], 10)))
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }

  const digits = trimmed.replace(/\D/g, '')
  if (digits.length >= 3) {
    const hour = Math.min(23, Math.max(0, parseInt(digits.slice(0, 2), 10)))
    const minute = Math.min(59, Math.max(0, parseInt(digits.slice(2, 4).padEnd(2, '0'), 10)))
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }

  return trimmed
}

export function normalizeDateTimeLocalInput(value: string): string {
  if (!value) return ''
  const trimmed = value.trim()
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/)
  return match ? match[1] : ''
}

export function splitDateTimeLocal(value: string): { date: string; time: string } {
  if (!value) return { date: '', time: '' }
  if (value.startsWith('T')) {
    return { date: '', time: value.slice(1) }
  }

  const tIndex = value.indexOf('T')
  if (tIndex === -1) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return { date: value, time: '' }
    return { date: '', time: '' }
  }

  const datePart = value.slice(0, tIndex)
  const timePart = value.slice(tIndex + 1)

  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart) && PARTIAL_TIME_RE.test(timePart)) {
    return { date: datePart, time: timePart }
  }

  const normalized = normalizeDateTimeLocalInput(value)
  if (!normalized) return { date: datePart, time: timePart }

  const [date, time] = normalized.split('T')
  return { date, time }
}

export function combineDateTimeLocalRaw(date: string, time: string): string {
  const d = date.trim()
  const t = time.trim()
  if (!d && !t) return ''
  if (!d) return `T${t}`
  if (!t) return `${d}T`
  return `${d}T${t}`
}

export function combineDateTimeLocal(date: string, time: string): string {
  const d = date.trim()
  const t = normalizeTimeInput(time)
  return combineDateTimeLocalRaw(d, t)
}

export function isValidDateTimeLocalInput(value: string): boolean {
  const normalized = normalizeDateTimeLocalInput(value)
  if (!normalized) return false
  if (!DATETIME_LOCAL_RE.test(normalized)) return false
  return !Number.isNaN(parseLocalDateTime(normalized).getTime())
}

export function getDateTimeValidationError(value: string, fieldLabel: string): string | null {
  if (!value?.trim()) return `${fieldLabel}을(를) 입력해주세요.`
  if (value.startsWith('T')) return `${fieldLabel}의 날짜를 선택해주세요.`
  const { date, time } = splitDateTimeLocal(value)
  if (date && !time) return `${fieldLabel}의 시간을 입력해주세요. (24시간 형식, 예: 14:30)`
  if (!date && time) return `${fieldLabel}의 날짜를 선택해주세요.`
  if (!isValidDateTimeLocalInput(value)) return `${fieldLabel} 형식이 올바르지 않습니다.`
  return null
}

/** DB / ISO timestamp → datetime-local value (local wall clock). */
export function toDateTimeLocalValue(value: Date | string | null | undefined): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function parseLocalDateTime(normalized: string): Date {
  const [datePart, timePart] = normalized.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute)
}

/** datetime-local string → ISO for DB (preserves local wall clock). */
export function fromDateTimeLocalToISO(value: string | null | undefined): string | null {
  const normalized = normalizeDateTimeLocalInput(value ?? '')
  if (!normalized) return null
  const local = parseLocalDateTime(normalized)
  if (Number.isNaN(local.getTime())) return null
  return local.toISOString()
}

/** API input: datetime-local or ISO string → ISO timestamp. */
export function parseTimestampInput(value: unknown): string | null {
  if (value == null || value === '') return null
  if (typeof value !== 'string') return null

  const fromLocal = fromDateTimeLocalToISO(value)
  if (fromLocal) return fromLocal

  const d = new Date(value)
  if (!Number.isNaN(d.getTime())) return d.toISOString()
  return null
}

export function nowDateTimeLocalValue(): string {
  return toDateTimeLocalValue(new Date())
}
