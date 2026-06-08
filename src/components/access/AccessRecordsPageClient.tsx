'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'
import AccessRecordForm from '@/components/access/AccessRecordForm'
import AccessRecordTable from '@/components/access/AccessRecordTable'
import type { Visitor } from '@/types'

interface AccessRecordsPageClientProps {
  visitors: Pick<Visitor, 'id' | 'name' | 'company'>[]
  canCreate: boolean
  canSync: boolean
}

export default function AccessRecordsPageClient({
  visitors,
  canCreate,
  canSync,
}: AccessRecordsPageClientProps) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [syncing, setSyncing] = useState(false)

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch('/api/access-records/sync', { method: 'POST' })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? '동기화에 실패했습니다.')
        return
      }
      const { message } = await res.json()
      toast.success(message ?? '동기화가 완료되었습니다.')
      setRefreshKey((k) => k + 1)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {canCreate && (
        <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">수동 등록</h2>
          <AccessRecordForm
            visitors={visitors}
            onCreated={() => setRefreshKey((k) => k + 1)}
          />
        </div>
      )}

      <div className={`${canCreate ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-lg border border-gray-200 p-6 space-y-4`}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">출입 기록 목록</h2>
          {canSync && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={syncing}
              onClick={handleSync}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? '동기화 중...' : '동기화 (Stub)'}
            </Button>
          )}
        </div>
        <AccessRecordTable refreshKey={refreshKey} />
      </div>
    </div>
  )
}
