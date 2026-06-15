/**
 * datetime-local input helpers.
 * HTML datetime-local uses local time (no timezone); never use toISOString().slice(0, 16).
 */

const DATETIME_LOCAL_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

export function normalizeDateTimeLocalInput(value: string): string {
  if (!value) return ''
  const trimmed = value.trim()
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/)
  return match ? match[1] : ''
}

export function isValidDateTimeLocalInput(value: string): boolean {
  const normalized = normalizeDateTimeLocalInput(value)
  if (!normalized) return false
  if (!DATETIME_LOCAL_RE.test(normalized)) return false
  return !Number.isNaN(parseLocalDateTime(normalized).getTime())
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
