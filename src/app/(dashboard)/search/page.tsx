import { Suspense } from 'react'
import SearchForm from '@/components/search/SearchForm'
import SearchResults from '@/components/search/SearchResults'

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">통합 검색</h1>
        <p className="text-sm text-gray-500 mt-1">방문객·미팅 전체 텍스트 검색</p>
      </div>

      <Suspense fallback={<div className="h-32 bg-gray-50 rounded-lg animate-pulse" />}>
        <SearchForm />
      </Suspense>

      <Suspense fallback={<p className="text-sm text-gray-500">결과 불러오는 중...</p>}>
        <SearchResults />
      </Suspense>
    </div>
  )
}
