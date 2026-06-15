import { auth } from '@/auth'
import { Suspense } from 'react'
import SearchForm from '@/components/search/SearchForm'
import SearchResults from '@/components/search/SearchResults'
import type { UserRole } from '@/types'

export default async function SearchPage() {
  const session = await auth()
  const role = (session?.user?.role ?? 'guest') as UserRole

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">통합 검색</h1>
        <p className="text-sm text-gray-500 mt-1">
          방문·미팅·출장·출입 기록을 한 번에 검색하여 업무 스토리를 확인합니다.
        </p>
      </div>

      <Suspense fallback={<div className="h-32 bg-gray-50 rounded-lg animate-pulse" />}>
        <SearchForm userRole={role} />
      </Suspense>

      <Suspense fallback={<p className="text-sm text-gray-500">결과 불러오는 중...</p>}>
        <SearchResults />
      </Suspense>
    </div>
  )
}
