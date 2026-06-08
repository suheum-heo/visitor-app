'use client'

import ErrorFallback from '@/components/ui/ErrorFallback'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorFallback
      title="대시보드 오류"
      message={error.message || '대시보드를 불러오는 중 문제가 발생했습니다.'}
      reset={reset}
    />
  )
}
