'use client'

import { useState } from 'react'
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
import ProjectSelect from '@/components/projects/ProjectSelect'
import { visitorSelectItems } from '@/lib/select-items'
import {
  fromDateTimeLocalToISO,
  getDateTimeValidationError,
  nowDateTimeLocalValue,
} from '@/lib/datetime-local'
import { ACCESS_RECORD_CATEGORIES } from '@/constants'
import type { AccessRecordCategory, Visitor } from '@/types'

const DIRECTION_ITEMS = [
  { value: 'in', label: '입장' },
  { value: 'out', label: '퇴장' },
] as const

const CATEGORY_ITEMS = Object.entries(ACCESS_RECORD_CATEGORIES).map(([value, label]) => ({
  value,
  label,
}))

interface AccessRecordFormProps {
  visitors: Pick<Visitor, 'id' | 'name' | 'company'>[]
  onCreated?: () => void
}

export default function AccessRecordForm({ visitors, onCreated }: AccessRecordFormProps) {
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const visitorItems = visitorSelectItems(visitors)
  const [form, setForm] = useState({
    record_category: 'person' as AccessRecordCategory,
    name: '',
    company: '',
    vehicle_number: '',
    direction: 'in',
    access_point: '',
    recorded_at: nowDateTimeLocalValue(),
    visitor_id: '',
    project_id: '',
    notes: '',
  })

  const isVehicle = form.record_category === 'vehicle' || form.record_category === 'delivery'

  function handleVisitorSelect(visitorId: string | null) {
    if (!visitorId) {
      setForm((prev) => ({ ...prev, visitor_id: '' }))
      return
    }
    const visitor = visitors.find((v) => v.id === visitorId)
    setForm((prev) => ({
      ...prev,
      visitor_id: visitorId,
      name: visitor?.name ?? prev.name,
      company: visitor?.company ?? prev.company,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errors: Record<string, string> = {}
    const resolvedName = form.name.trim() || form.vehicle_number.trim()

    if (!resolvedName) {
      errors.name = isVehicle ? '차량번호 또는 이름을 입력해주세요.' : '이름을 입력해주세요.'
    }

    const recordedError = getDateTimeValidationError(form.recorded_at, '기록 시간')
    if (recordedError) errors.recorded_at = recordedError

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      toast.error('입력 내용을 확인해주세요.')
      return
    }

    setFieldErrors({})
    const recordedIso = fromDateTimeLocalToISO(form.recorded_at)!

    setLoading(true)
    try {
      const res = await fetch('/api/access-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          name: form.name.trim() || form.vehicle_number.trim(),
          visitor_id: form.visitor_id || null,
          project_id: form.project_id || null,
          vehicle_number: form.vehicle_number.trim() || null,
          recorded_at: recordedIso,
        }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? '등록에 실패했습니다.')
        return
      }

      toast.success('출입 기록이 등록되었습니다.')
      setForm({
        record_category: 'person',
        name: '',
        company: '',
        vehicle_number: '',
        direction: 'in',
        access_point: '',
        recorded_at: nowDateTimeLocalValue(),
        visitor_id: '',
        project_id: '',
        notes: '',
      })
      onCreated?.()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label>출입 유형 *</Label>
        <Select
          value={form.record_category}
          onValueChange={(v) => v && setForm((p) => ({ ...p, record_category: v as AccessRecordCategory }))}
          items={CATEGORY_ITEMS}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {form.record_category === 'person' && (
        <div className="space-y-2">
          <Label>방문객 연결 (선택)</Label>
          <Select
            value={form.visitor_id}
            onValueChange={handleVisitorSelect}
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
      )}

      <div className="grid grid-cols-2 gap-4">
        {isVehicle && (
          <div className="space-y-2">
            <Label htmlFor="ar-vehicle">차량번호 *</Label>
            <Input
              id="ar-vehicle"
              value={form.vehicle_number}
              onChange={(e) => setForm((p) => ({ ...p, vehicle_number: e.target.value }))}
              placeholder="12가1234"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="ar-name">{isVehicle ? '운전자/담당자' : '이름 *'}</Label>
          <Input
            id="ar-name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            aria-invalid={fieldErrors.name ? true : undefined}
          />
          {fieldErrors.name && (
            <p className="text-xs text-destructive" role="alert">{fieldErrors.name}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="ar-company">회사</Label>
          <Input
            id="ar-company"
            value={form.company}
            onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
          />
        </div>
      </div>

      <ProjectSelect
        value={form.project_id}
        onChange={(id) => setForm((p) => ({ ...p, project_id: id }))}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>방향 *</Label>
          <Select
            value={form.direction}
            onValueChange={(v) => v && setForm((p) => ({ ...p, direction: v }))}
            items={[...DIRECTION_ITEMS]}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in">입장</SelectItem>
              <SelectItem value="out">퇴장</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DateTimeInput
          id="ar-time"
          label="기록 시간"
          value={form.recorded_at}
          onChange={(v) => setForm((p) => ({ ...p, recorded_at: v }))}
          required
          error={fieldErrors.recorded_at}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ar-point">출입구</Label>
        <Input
          id="ar-point"
          value={form.access_point}
          onChange={(e) => setForm((p) => ({ ...p, access_point: e.target.value }))}
          placeholder="정문, 지하 주차장 등"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ar-notes">메모</Label>
        <Textarea
          id="ar-notes"
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          rows={2}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? '등록 중...' : '출입 기록 등록'}
      </Button>
    </form>
  )
}
