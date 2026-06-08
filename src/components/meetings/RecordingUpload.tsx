'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Mic, Upload } from 'lucide-react'
import type { MeetingRecording, TranscriptionStatus } from '@/types'

interface RecordingUploadProps {
  meetingId: string
  canEdit: boolean
}

const STATUS_LABELS: Record<TranscriptionStatus, string> = {
  pending: '대기',
  processing: '처리 중',
  done: '완료',
}

const STATUS_VARIANTS: Record<TranscriptionStatus, 'default' | 'secondary' | 'outline'> = {
  pending: 'outline',
  processing: 'default',
  done: 'secondary',
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function RecordingUpload({ meetingId, canEdit }: RecordingUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [recordings, setRecordings] = useState<MeetingRecording[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const fetchRecordings = useCallback(async () => {
    try {
      const res = await fetch(`/api/meeting-recordings?meeting_id=${meetingId}`)
      if (res.ok) {
        const { data } = await res.json()
        setRecordings(data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [meetingId])

  useEffect(() => {
    fetchRecordings()
  }, [fetchRecordings])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('meeting_id', meetingId)
      formData.append('file', file)

      const res = await fetch('/api/meeting-recordings', { method: 'POST', body: formData })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? '업로드에 실패했습니다.')
        return
      }

      toast.success('녹음 파일이 업로드되었습니다. 전사는 준비 중입니다.')
      await fetchRecordings()
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">미팅 녹음</h2>
        {canEdit && (
          <>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept="audio/*,video/*,.mp3,.mp4,.wav,.webm,.ogg,.m4a,.mov"
              onChange={handleUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-1" />
              {uploading ? '업로드 중...' : '녹음 업로드'}
            </Button>
          </>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">불러오는 중...</p>
      ) : recordings.length === 0 ? (
        <p className="text-sm text-gray-500">업로드된 녹음이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
          {recordings.map((rec) => (
            <li key={rec.id} className="px-4 py-3 text-sm space-y-2">
              <div className="flex items-center justify-between gap-2">
                <a
                  href={rec.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:underline min-w-0"
                >
                  <Mic className="h-4 w-4 shrink-0" />
                  <span className="truncate">{rec.file_name}</span>
                  <span className="text-gray-400 shrink-0">({formatSize(rec.file_size)})</span>
                </a>
                <Badge variant={STATUS_VARIANTS[rec.transcription_status]}>
                  전사 {STATUS_LABELS[rec.transcription_status]}
                </Badge>
              </div>
              {rec.transcription_text && (
                <p className="text-gray-600 text-xs whitespace-pre-wrap bg-gray-50 rounded p-2">
                  {rec.transcription_text}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
