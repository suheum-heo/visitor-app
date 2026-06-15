'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  combineDateTimeLocal,
  normalizeTimeInput,
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
  const [date, setDate] = useState(parsed.date)
  const [time, setTime] = useState(parsed.time)

  useEffect(() => {
    const next = splitDateTimeLocal(value)
    setDate(next.date)
    setTime(next.time)
  }, [value])

  function emit(datePart: string, timePart: string) {
    onChange(combineDateTimeLocal(datePart, timePart))
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
          type="date"
          value={date}
          onChange={(e) => {
            const nextDate = e.target.value
            setDate(nextDate)
            emit(nextDate, time)
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : `${id}-hint`}
        />
        <Input
          id={`${id}-time`}
          type="time"
          step={60}
          value={time}
          onChange={(e) => {
            const nextTime = normalizeTimeInput(e.target.value)
            setTime(nextTime)
            emit(date, nextTime)
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : `${id}-hint`}
        />
      </div>
      <p id={`${id}-hint`} className="text-xs text-gray-500">
        시간은 24시간 형식입니다 (예: 14:30)
      </p>
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
