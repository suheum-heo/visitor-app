'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export default function LoginForm() {
  const [loading, setLoading] = useState(false)

  async function handleGoogleSignIn() {
    setLoading(true)
    await signIn('google', { callbackUrl: '/' })
  }

  return (
    <Button
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="w-full"
      size="lg"
    >
      {loading ? '로그인 중...' : 'Google 계정으로 로그인'}
    </Button>
  )
}
