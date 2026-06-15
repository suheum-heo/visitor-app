'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import DateTimeInput from '@/components/ui/DateTimeInput'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import TagInput from '@/components/ui/TagInput'
import ProjectSelect from '@/components/projects/ProjectSelect'
import { userSelectItems } from '@/lib/select-items'
import {
  fromDateTimeLocalToISO,
  getDateTimeValidationError,
  toDateTimeLocalValue,
} from '@/lib/datetime-local'
import type { BusinessTrip, User } from '@/types'

interface BusinessTripFormProps {
  trip?: BusinessTrip
  employees: Pick<User, 'id' | 'name' | 'email'>[]
  currentUserId: string
}

export default function BusinessTripForm({ trip, employees, currentUserId }: BusinessTripFormProps) {
  const router = useRouter()
  const isEdit = !!trip
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const employeeItems = userSelectItems(employees)

  const [form, setForm] = useState({
    title: trip?.title ?? '',
    employee_id: trip?.employee_id ?? currentUserId,
    company: trip?.company ?? '',
    location: trip?.location ?? '',
    project_id: trip?.project_id ?? '',
    purpose: trip?.purpose ?? '',
    scheduled_at: toDateTimeLocalValue(trip?.scheduled_at),
    end_at: toDateTimeLocalValue(trip?.end_at),
    notes: trip?.notes ?? '',
    tags: trip?.tags ?? [] as string[],
  })

  function handleChange(field: string, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value ?? '' }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errors: Record<string, string> = {}

    if (!form.title.trim()) {
      errors.title = '출장 제목을 입력해주세요.'
    }

    const scheduledError = getDateTimeValidationError(form.scheduled_at, '출발 일시')
    if (scheduledError) errors.scheduled_at = scheduledError

    if (form.end_at.trim()) {
      const endError = getDateTimeValidationError(form.end_at, '복귀 일시')
      if (endError) errors.end_at = endError
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      toast.error('입력 내용을 확인해주세요.')
      return
    }

    setFieldErrors({})

    const scheduledIso = fromDateTimeLocalToISO(form.scheduled_at)!
    const endIso = form.end_at.trim() ? fromDateTimeLocalToISO(form.end_at) : null

    if (endIso && new Date(endIso).getTime() < new Date(scheduledIso).getTime()) {
      setFieldErrors({ end_at: '복귀 일시가 출발 일시보다 이전입니다.' })
      toast.error('복귀 일시가 출발 일시보다 이전입니다. 시간을 확인해주세요.')
      return
    }

    setLoading(true)
    try {
      const url = isEdit ? `/api/business-trips/${trip!.id}` : '/api/business-trips'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          scheduled_at: scheduledIso,
          end_at: endIso,
          project_id: form.project_id || null,
        }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? '저장에 실패했습니다.')
        return
      }

      toast.success(isEdit ? '출장 정보가 수정되었습니다.' : '출장이 등록되었습니다.')
      const { data } = await res.json()
      router.push(`/trips/${data.id}`)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="trip-title">출장 제목 *</Label>
        <Input
          id="trip-title"
          value={form.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="삼성전자 기술 협의"
          aria-invalid={fieldErrors.title ? true : undefined}
        />
        {fieldErrors.title && (
          <p className="text-xs text-destructive" role="alert">{fieldErrors.title}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>출장자 *</Label>
          <Select
            value={form.employee_id}
            onValueChange={(v) => v && handleChange('employee_id', v)}
            items={employeeItems}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.name ?? emp.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ProjectSelect
          value={form.project_id}
          onChange={(id) => handleChange('project_id', id)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="trip-company">방문 회사</Label>
          <Input
            id="trip-company"
            value={form.company}
            onChange={(e) => handleChange('company', e.target.value)}
            placeholder="삼성전자"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trip-location">방문 장소</Label>
          <Input
            id="trip-location"
            value={form.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="수원 사업장"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="trip-purpose">출장 목적</Label>
        <Input
          id="trip-purpose"
          value={form.purpose}
          onChange={(e) => handleChange('purpose', e.target.value)}
          placeholder="양산 검토, 기술 미팅 등"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <DateTimeInput
          id="trip-start"
          label="출발 일시"
          value={form.scheduled_at}
          onChange={(v) => handleChange('scheduled_at', v)}
          required
          error={fieldErrors.scheduled_at}
        />
        <DateTimeInput
          id="trip-end"
          label="복귀 일시"
          value={form.end_at}
          onChange={(v) => handleChange('end_at', v)}
          error={fieldErrors.end_at}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="trip-tags">태그</Label>
        <TagInput id="trip-tags" value={form.tags} onChange={(tags) => setForm((p) => ({ ...p, tags }))} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="trip-notes">메모</Label>
        <Textarea
          id="trip-notes"
          value={form.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? '저장 중...' : isEdit ? '수정 저장' : '출장 등록'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          취소
        </Button>
      </div>
    </form>
  )
}
