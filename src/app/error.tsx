'use client'

import ErrorFallback from '@/components/ui/ErrorFallback'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <ErrorFallback
        message={error.message || '페이지를 불러오는 중 문제가 발생했습니다.'}
        reset={reset}
      />
    </div>
  )
}
