/**
 * datetime-local input helpers.
 * Use split date + time inputs (24h) in UI; never use toISOString().slice(0, 16).
 */

const DATETIME_LOCAL_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
const DATE_LOCAL_RE = /^\d{4}-\d{2}-\d{2}$/
const PARTIAL_TIME_RE = /^(\d{0,4}|\d{0,2}(:\d{0,2})?)$/
const KOREA_TIME_ZONE = 'Asia/Seoul'
const KOREA_TIME_OFFSET = '+09:00'
const OFFSET_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})$/i

/** 입력 중 허용되는 날짜 문자열 (정규화 없음) */
export function formatDateInput(raw: string): string {
  return raw.replace(/[^\d.\-/\s년월일]/g, '').slice(0, 16)
}

export function normalizeDateInput(date: string): string {
  const trimmed = date.trim()
  if (!trimmed) return ''

  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 8) {
    return normalizeDateParts(digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)) || trimmed
  }

  const separated = trimmed
    .replace(/[년월]/g, '-')
    .replace(/일/g, '')
    .replace(/[./]/g, '-')
    .replace(/\s+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const parts = separated.split('-')
  if (parts.length === 3) {
    return normalizeDateParts(parts[0], parts[1], parts[2]) || trimmed
  }

  return trimmed
}

export function formatKoreanDateInput(date: string): string {
  const normalized = normalizeDateInput(date)
  if (!DATE_LOCAL_RE.test(normalized)) return date.trim()

  const [year, month, day] = normalized.split('-')
  return `${year}. ${month}. ${day}.`
}

function normalizeDateParts(yearText: string, monthText: string, dayText: string): string {
  if (!/^\d{4}$/.test(yearText) || !/^\d{1,2}$/.test(monthText) || !/^\d{1,2}$/.test(dayText)) {
    return ''
  }

  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  if (!isValidLocalDate(year, month, day)) return ''

  return `${yearText}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function isValidLocalDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false

  const d = new Date(year, month - 1, day)
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day
}

/** 입력 중 허용되는 부분 시간 문자열 (정규화 없음) */
export function formatTimeInput(raw: string): string {
  const cleaned = raw.replace(/[^\d:]/g, '')
  const colonIndex = cleaned.indexOf(':')

  if (colonIndex < 0) {
    return cleaned.slice(0, 4)
  }

  const hour = cleaned.slice(0, colonIndex).slice(0, 2)
  const afterColon = cleaned.slice(colonIndex + 1).replace(/:/g, '')

  if (afterColon.length === 0 && cleaned.endsWith(':')) return `${hour}:`

  const minute = afterColon.slice(0, 2)
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
  if (digits.length === 3 || digits.length === 4) {
    const hourDigits = digits.length === 3 ? digits.slice(0, 1) : digits.slice(0, 2)
    const minuteDigits = digits.slice(-2)
    const hour = Math.min(23, Math.max(0, parseInt(hourDigits, 10)))
    const minute = Math.min(59, Math.max(0, parseInt(minuteDigits, 10)))
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }

  return trimmed
}

export function normalizeDateTimeLocalInput(value: string): string {
  if (!value) return ''
  const trimmed = value.trim()
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/)
  if (match) return match[1]

  const localMatch = trimmed.match(/^(.+)T(.+)$/)
  if (!localMatch) return ''

  const normalizedDate = normalizeDateInput(localMatch[1])
  const normalizedTime = normalizeTimeInput(localMatch[2])
  return DATE_LOCAL_RE.test(normalizedDate) && /^\d{2}:\d{2}$/.test(normalizedTime)
    ? `${normalizedDate}T${normalizedTime}`
    : ''
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
  const normalizedDate = normalizeDateInput(datePart)

  if (DATE_LOCAL_RE.test(normalizedDate) && PARTIAL_TIME_RE.test(timePart)) {
    return { date: normalizedDate, time: timePart }
  }

  const normalized = normalizeDateTimeLocalInput(value)
  if (!normalized) return { date: datePart, time: timePart }

  const [date, time] = normalized.split('T')
  return { date, time }
}

export function combineDateTimeLocalRaw(date: string, time: string): string {
  const d = normalizeDateInput(date)
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

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: KOREA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''

  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
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
  return `${normalized}:00${KOREA_TIME_OFFSET}`
}

export function formatDateTimeKorean(value: Date | string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: KOREA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(d)
}

/** API input: datetime-local or ISO string → ISO timestamp. */
export function parseTimestampInput(value: unknown): string | null {
  if (value == null || value === '') return null
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (OFFSET_TIMESTAMP_RE.test(trimmed) && !Number.isNaN(new Date(trimmed).getTime())) {
    return trimmed
  }

  const fromLocal = fromDateTimeLocalToISO(value)
  if (fromLocal) return fromLocal

  const d = new Date(value)
  if (!Number.isNaN(d.getTime())) return d.toISOString()
  return null
}

export function nowDateTimeLocalValue(): string {
  return toDateTimeLocalValue(new Date())
}
