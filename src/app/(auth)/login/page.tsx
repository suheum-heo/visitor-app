import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import LoginForm from './LoginForm'

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect('/')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">방문객 관리 시스템</h1>
            <p className="mt-2 text-sm text-gray-500">사내 계정으로 로그인하세요</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
