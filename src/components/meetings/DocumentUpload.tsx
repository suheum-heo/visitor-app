'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { FileText, Trash2, Upload } from 'lucide-react'

interface Document {
  id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  created_at: string
  uploader?: { id: string; name: string | null }
}

interface DocumentUploadProps {
  meetingId: string
  canEdit: boolean
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentUpload({ meetingId, canEdit }: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents?meeting_id=${meetingId}`)
      if (res.ok) {
        const { data } = await res.json()
        setDocuments(data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [meetingId])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('meeting_id', meetingId)
      formData.append('file', file)

      const res = await fetch('/api/documents', { method: 'POST', body: formData })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? '업로드에 실패했습니다.')
        return
      }

      toast.success('문서가 업로드되었습니다.')
      await fetchDocuments()
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('이 문서를 삭제하시겠습니까?')) return

    const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const { error } = await res.json()
      toast.error(error ?? '삭제에 실패했습니다.')
      return
    }

    toast.success('문서가 삭제되었습니다.')
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">첨부 문서</h2>
        {canEdit && (
          <>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.webp"
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
              {uploading ? '업로드 중...' : '문서 업로드'}
            </Button>
          </>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">불러오는 중...</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-gray-500">첨부된 문서가 없습니다.</p>
      ) : (
        <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <a
                href={doc.file_path}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:underline min-w-0"
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">{doc.file_name}</span>
                <span className="text-gray-400 shrink-0">({formatSize(doc.file_size)})</span>
              </a>
              {canEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 shrink-0"
                  onClick={() => handleDelete(doc.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
