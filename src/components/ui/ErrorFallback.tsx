'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface ErrorFallbackProps {
  title?: string
  message?: string
  reset?: () => void
}

export default function ErrorFallback({
  title = '오류가 발생했습니다',
  message = '일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  reset,
}: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 p-8 text-center">
      <AlertTriangle className="h-12 w-12 text-orange-500" />
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 max-w-md">{message}</p>
      </div>
      {reset && (
        <Button type="button" onClick={reset}>
          다시 시도
        </Button>
      )}
    </div>
  )
}
