'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function LoginForm() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function signInWithGoogle() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })
  }

  return (
    <Button
      onClick={signInWithGoogle}
      disabled={loading}
      className="w-full"
      size="lg"
    >
      {loading ? '로그인 중...' : 'Google 계정으로 로그인'}
    </Button>
  )
}
