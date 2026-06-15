'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import TagInput from '@/components/ui/TagInput'
import DateTimeInput from '@/components/ui/DateTimeInput'
import { userSelectItems, visitorSelectItems } from '@/lib/select-items'
import { MEETING_TYPES } from '@/constants'
import ProjectSelect from '@/components/projects/ProjectSelect'
import {
  fromDateTimeLocalToISO,
  getDateTimeValidationError,
  toDateTimeLocalValue,
} from '@/lib/datetime-local'
import type { Meeting, User, Visitor, MeetingType } from '@/types'

interface MeetingFormProps {
  meeting?: Meeting
  hosts: Pick<User, 'id' | 'name' | 'email'>[]
  visitors: Pick<Visitor, 'id' | 'name' | 'company'>[]
  currentUserId: string
}

export default function MeetingForm({ meeting, hosts, visitors, currentUserId }: MeetingFormProps) {
  const router = useRouter()
  const isEdit = !!meeting

  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const hostItems = userSelectItems(hosts)
  const visitorItems = visitorSelectItems(visitors)
  const meetingTypeItems = Object.entries(MEETING_TYPES).map(([value, label]) => ({
    value,
    label,
  }))
  const [form, setForm] = useState({
    title: meeting?.title ?? '',
    description: meeting?.description ?? '',
    meeting_type: meeting?.meeting_type ?? 'internal' as MeetingType,
    host_id: meeting?.host_id ?? currentUserId,
    visitor_id: meeting?.visitor_id ?? '',
    project_id: meeting?.project_id ?? '',
    location: meeting?.location ?? '',
    scheduled_at: toDateTimeLocalValue(meeting?.scheduled_at),
    duration_minutes: String(meeting?.duration_minutes ?? '60'),
    notes: meeting?.notes ?? '',
    zoom_link: meeting?.zoom_link ?? '',
    tags: meeting?.tags ?? [] as string[],
  })

  function handleChange(field: string, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value ?? '' }))
  }

  function handleTagsChange(tags: string[]) {
    setForm((prev) => ({ ...prev, tags }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errors: Record<string, string> = {}

    if (!form.title.trim()) {
      errors.title = '미팅 제목을 입력해주세요.'
    }

    const scheduledError = getDateTimeValidationError(form.scheduled_at, '예정 시간')
    if (scheduledError) errors.scheduled_at = scheduledError

    const duration = parseInt(form.duration_minutes, 10)
    if (!duration || duration < 15) {
      errors.duration_minutes = '소요 시간은 15분 이상으로 입력해주세요.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      toast.error('입력 내용을 확인해주세요.')
      return
    }

    setFieldErrors({})
    const scheduledIso = fromDateTimeLocalToISO(form.scheduled_at)!

    setLoading(true)
    try {
      const url = isEdit ? `/api/meetings/${meeting!.id}` : '/api/meetings'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          scheduled_at: scheduledIso,
          visitor_id: form.visitor_id || null,
          project_id: form.project_id || null,
          zoom_link: form.zoom_link.trim() || null,
          duration_minutes: duration,
        }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? '저장에 실패했습니다.')
        return
      }

      toast.success(isEdit ? '미팅 정보가 수정되었습니다.' : '미팅이 등록되었습니다.')
      router.push('/meetings')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 max-w-lg">
      <div className="space-y-2">
        <Label htmlFor="title">미팅 제목 *</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="파트너십 논의"
          aria-invalid={fieldErrors.title ? true : undefined}
        />
        {fieldErrors.title && (
          <p className="text-xs text-destructive" role="alert">{fieldErrors.title}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="미팅 목적과 안건을 간략히 입력하세요."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>미팅 유형</Label>
          <Select
            value={form.meeting_type}
            onValueChange={(v) => v && handleChange('meeting_type', v)}
            items={meetingTypeItems}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {meetingTypeItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
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
          <Label>담당자 *</Label>
          <Select
            value={form.host_id}
            onValueChange={(v) => v && handleChange('host_id', v)}
            items={hostItems}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {hosts.map((host) => (
                <SelectItem key={host.id} value={host.id}>
                  {host.name ?? host.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>방문객 (선택)</Label>
          <Select
            value={form.visitor_id}
            onValueChange={(v) => handleChange('visitor_id', v ?? '')}
            items={visitorItems}
          >
            <SelectTrigger>
              <SelectValue placeholder="없음" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">없음</SelectItem>
              {visitors.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}{v.company ? ` (${v.company})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <DateTimeInput
          id="scheduled_at"
          label="예정 시간"
          value={form.scheduled_at}
          onChange={(v) => handleChange('scheduled_at', v)}
          required
          error={fieldErrors.scheduled_at}
        />
        <div className="space-y-2">
          <Label htmlFor="duration">소요 시간 (분)</Label>
          <Input
            id="duration"
            type="number"
            value={form.duration_minutes}
            onChange={(e) => handleChange('duration_minutes', e.target.value)}
            aria-invalid={fieldErrors.duration_minutes ? true : undefined}
          />
          {fieldErrors.duration_minutes && (
            <p className="text-xs text-destructive" role="alert">{fieldErrors.duration_minutes}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">장소</Label>
        <Input
          id="location"
          value={form.location}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="3층 회의실 A"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="zoom_link">Zoom 미팅 링크</Label>
        <Input
          id="zoom_link"
          type="url"
          value={form.zoom_link}
          onChange={(e) => handleChange('zoom_link', e.target.value)}
          placeholder="https://zoom.us/j/..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">태그</Label>
        <TagInput id="tags" value={form.tags} onChange={handleTagsChange} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">메모</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? '저장 중...' : isEdit ? '수정 저장' : '미팅 등록'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          취소
        </Button>
      </div>
    </form>
  )
}
