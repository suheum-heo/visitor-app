'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { CreditCard, Upload } from 'lucide-react'

interface OcrData {
  image_url: string
  name: string | null
  company: string | null
  position: string | null
  phone: string | null
  email: string | null
  ocr_raw: Record<string, unknown>
}

export interface BusinessCardExtracted {
  name: string
  company: string
  position: string
  phone: string
  email: string
}

interface BusinessCardOcrProps {
  visitorId?: string
  meetingId?: string
  onSaved?: () => void
  onExtracted?: (data: BusinessCardExtracted) => void
}

export default function BusinessCardOcr({
  visitorId,
  meetingId,
  onSaved,
  onExtracted,
}: BusinessCardOcrProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [scanning, setScanning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [ocr, setOcr] = useState<OcrData | null>(null)
  const [form, setForm] = useState({
    name: '',
    company: '',
    position: '',
    phone: '',
    email: '',
  })

  async function handleScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setScanning(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/business-cards', { method: 'POST', body: formData })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? 'OCR 처리에 실패했습니다.')
        return
      }

      const { data } = await res.json() as { data: OcrData }
      const extracted = {
        name: data.name ?? '',
        company: data.company ?? '',
        position: data.position ?? '',
        phone: data.phone ?? '',
        email: data.email ?? '',
      }
      setOcr(data)
      setForm(extracted)
      onExtracted?.(extracted)
      toast.success('명함 정보를 추출했습니다. 내용을 확인 후 저장하세요.')
    } finally {
      setScanning(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleSave() {
    if (!ocr) return
    if (!form.name.trim()) {
      toast.error('이름은 필수입니다.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/business-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: ocr.image_url,
          name: form.name || null,
          company: form.company || null,
          position: form.position || null,
          phone: form.phone || null,
          email: form.email || null,
          visitor_id: visitorId ?? null,
          meeting_id: meetingId ?? null,
          ocr_raw: ocr.ocr_raw,
          confirmed: true,
        }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? '저장에 실패했습니다.')
        return
      }

      toast.success('명함 정보가 저장되었습니다.')
      setOcr(null)
      setForm({ name: '', company: '', position: '', phone: '', email: '' })
      onSaved?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          명함 OCR
        </h2>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleScan}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={scanning}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-1" />
          {scanning ? '인식 중...' : '명함 스캔'}
        </Button>
      </div>

      {ocr && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex gap-4">
            <img
              src={ocr.image_url}
              alt="명함"
              className="w-32 h-20 object-cover rounded border border-gray-200"
            />
            <p className="text-sm text-gray-500">
              추출된 정보를 확인하고 수정한 뒤 저장하세요.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="bc-name">이름 *</Label>
              <Input
                id="bc-name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bc-company">회사</Label>
              <Input
                id="bc-company"
                value={form.company}
                onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bc-position">직책</Label>
              <Input
                id="bc-position"
                value={form.position}
                onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bc-phone">전화</Label>
              <Input
                id="bc-phone"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label htmlFor="bc-email">이메일</Label>
              <Input
                id="bc-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '확인 후 저장'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOcr(null)}>
              취소
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
