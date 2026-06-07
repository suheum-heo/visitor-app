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
import { VISITOR_PURPOSES } from '@/constants'
import { toast } from 'sonner'
import type { Visitor, User, VisitorPurpose } from '@/types'

interface VisitorFormProps {
  visitor?: Visitor
  hosts: Pick<User, 'id' | 'name' | 'email'>[]
  currentUserId: string
}

export default function VisitorForm({ visitor, hosts, currentUserId }: VisitorFormProps) {
  const router = useRouter()
  const isEdit = !!visitor

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: visitor?.name ?? '',
    company: visitor?.company ?? '',
    phone: visitor?.phone ?? '',
    email: visitor?.email ?? '',
    purpose: visitor?.purpose ?? 'meeting' as VisitorPurpose,
    host_id: visitor?.host_id ?? currentUserId,
    scheduled_at: visitor?.scheduled_at
      ? new Date(visitor.scheduled_at).toISOString().slice(0, 16)
      : '',
    notes: visitor?.notes ?? '',
  })

  function handleChange(field: string, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value ?? '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('이름을 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const url = isEdit ? `/api/visitors/${visitor!.id}` : '/api/visitors'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          scheduled_at: form.scheduled_at || null,
        }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? '저장에 실패했습니다.')
        return
      }

      toast.success(isEdit ? '방문객 정보가 수정되었습니다.' : '방문객이 등록되었습니다.')
      router.push('/visitors')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">이름 *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="홍길동"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">회사</Label>
          <Input
            id="company"
            value={form.company}
            onChange={(e) => handleChange('company', e.target.value)}
            placeholder="(주)방문사"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">연락처</Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="010-0000-0000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="visitor@example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>방문 목적 *</Label>
          <Select
            value={form.purpose}
            onValueChange={(v) => handleChange('purpose', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(VISITOR_PURPOSES).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>담당자 *</Label>
          <Select
            value={form.host_id}
            onValueChange={(v) => handleChange('host_id', v)}
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="scheduled_at">방문 예정 시간</Label>
        <Input
          id="scheduled_at"
          type="datetime-local"
          value={form.scheduled_at}
          onChange={(e) => handleChange('scheduled_at', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">메모</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="특이사항이나 추가 정보를 입력하세요."
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? '저장 중...' : isEdit ? '수정 저장' : '방문객 등록'}
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
