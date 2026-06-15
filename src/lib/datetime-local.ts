/**
 * datetime-local input helpers.
 * Use split date + time inputs (24h) in UI; never use toISOString().slice(0, 16).
 */

const DATETIME_LOCAL_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

export function normalizeTimeInput(time: string): string {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})/)
  if (!match) return time.trim()
  const hour = Math.min(23, Math.max(0, parseInt(match[1], 10)))
  const minute = Math.min(59, Math.max(0, parseInt(match[2], 10)))
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
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
    return { date: '', time: normalizeTimeInput(value.slice(1)) }
  }
  const normalized = normalizeDateTimeLocalInput(value)
  if (!normalized) {
    const [dateOnly] = value.split('T')
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return { date: dateOnly, time: '' }
    return { date: '', time: '' }
  }
  const [date, time] = normalized.split('T')
  return { date, time }
}

export function combineDateTimeLocal(date: string, time: string): string {
  const d = date.trim()
  const t = normalizeTimeInput(time)
  if (!d && !t) return ''
  if (!d) return `T${t}`
  if (!t) return `${d}T`
  return `${d}T${t}`
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
