import 'next-auth'
import type { UserRole } from '@/types'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string
    role?: string
  }
}
