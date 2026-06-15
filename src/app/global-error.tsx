'use client'

import './globals.css'
import ErrorFallback from '@/components/ui/ErrorFallback'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <div className="flex min-h-screen items-center justify-center">
          <ErrorFallback
            title="시스템 오류"
            message={error.message || '예기치 않은 오류가 발생했습니다.'}
            reset={reset}
          />
        </div>
      </body>
    </html>
  )
}
