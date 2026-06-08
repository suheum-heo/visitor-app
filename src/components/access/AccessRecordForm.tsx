'use client'

import { useState } from 'react'
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
import type { Visitor } from '@/types'

interface AccessRecordFormProps {
  visitors: Pick<Visitor, 'id' | 'name' | 'company'>[]
  onCreated?: () => void
}

export default function AccessRecordForm({ visitors, onCreated }: AccessRecordFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    company: '',
    direction: 'in',
    access_point: '',
    recorded_at: new Date().toISOString().slice(0, 16),
    visitor_id: '',
    notes: '',
  })

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
    if (!form.name.trim()) {
      toast.error('이름은 필수입니다.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/access-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          visitor_id: form.visitor_id || null,
        }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? '등록에 실패했습니다.')
        return
      }

      toast.success('출입 기록이 등록되었습니다.')
      setForm({
        name: '',
        company: '',
        direction: 'in',
        access_point: '',
        recorded_at: new Date().toISOString().slice(0, 16),
        visitor_id: '',
        notes: '',
      })
      onCreated?.()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>방문객 연결 (선택)</Label>
        <Select value={form.visitor_id} onValueChange={handleVisitorSelect}>
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ar-name">이름 *</Label>
          <Input
            id="ar-name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>방향 *</Label>
          <Select
            value={form.direction}
            onValueChange={(v) => v && setForm((p) => ({ ...p, direction: v }))}
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
        <div className="space-y-2">
          <Label htmlFor="ar-time">기록 시간</Label>
          <Input
            id="ar-time"
            type="datetime-local"
            value={form.recorded_at}
            onChange={(e) => setForm((p) => ({ ...p, recorded_at: e.target.value }))}
          />
        </div>
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
