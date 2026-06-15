'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  combineDateTimeLocal,
  combineDateTimeLocalRaw,
  formatDateInput,
  formatKoreanDateInput,
  formatTimeInput,
  splitDateTimeLocal,
} from '@/lib/datetime-local'

interface DateTimeInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  error?: string | null
}

export default function DateTimeInput({
  id,
  label,
  value,
  onChange,
  required,
  error,
}: DateTimeInputProps) {
  const parsed = splitDateTimeLocal(value)
  const [date, setDate] = useState(formatKoreanDateInput(parsed.date))
  const [time, setTime] = useState(parsed.time)
  const dateFocusedRef = useRef(false)
  const timeFocusedRef = useRef(false)

  useEffect(() => {
    if (dateFocusedRef.current) return
    if (timeFocusedRef.current) return
    const next = splitDateTimeLocal(value)
    setDate(formatKoreanDateInput(next.date))
    setTime(next.time)
  }, [value])

  function emitRaw(datePart: string, timePart: string) {
    onChange(combineDateTimeLocalRaw(datePart, timePart))
  }

  function handleTimeBlur() {
    timeFocusedRef.current = false
    const normalized = combineDateTimeLocal(date, time)
    const next = splitDateTimeLocal(normalized)
    setDate(formatKoreanDateInput(next.date))
    setTime(next.time)
    onChange(normalized)
  }

  function handleDateBlur() {
    dateFocusedRef.current = false
    const normalized = combineDateTimeLocal(date, time)
    const next = splitDateTimeLocal(normalized)
    setDate(formatKoreanDateInput(next.date))
    setTime(next.time)
    onChange(normalized)
  }

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? ' *' : ''}
      </Label>
      <div className="grid grid-cols-2 gap-2">
        <Input
          id={`${id}-date`}
          type="text"
          inputMode="numeric"
          value={date}
          placeholder="2026. 06. 15."
          onFocus={() => {
            dateFocusedRef.current = true
          }}
          onChange={(e) => {
            const nextDate = formatDateInput(e.target.value)
            setDate(nextDate)
            emitRaw(nextDate, time)
          }}
          onBlur={handleDateBlur}
          className="font-mono tabular-nums"
          aria-label="날짜 (한국식, YYYY. MM. DD.)"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : `${id}-hint`}
        />
        <Input
          id={`${id}-time`}
          type="text"
          inputMode="numeric"
          value={time}
          placeholder="14:30"
          onFocus={() => {
            timeFocusedRef.current = true
          }}
          onChange={(e) => {
            const formatted = formatTimeInput(e.target.value)
            setTime(formatted)
            emitRaw(date, formatted)
          }}
          onBlur={handleTimeBlur}
          className="font-mono tabular-nums"
          aria-label="시간 (24시간, HH:MM)"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : `${id}-hint`}
        />
      </div>
      <p id={`${id}-hint`} className="text-xs text-gray-500">
        날짜는 한국식, 시간은 24시간 형식으로 입력 (예: 2026. 06. 15. 14:30)
      </p>
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
