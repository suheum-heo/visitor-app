import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import sql from '@/lib/db'
import type { UserRole } from '@/types'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false
      try {
        await sql`
          INSERT INTO users (email, name, avatar_url, google_id)
          VALUES (${user.email}, ${user.name ?? null}, ${user.image ?? null}, ${account?.providerAccountId ?? null})
          ON CONFLICT (email) DO UPDATE SET
            name       = EXCLUDED.name,
            avatar_url = EXCLUDED.avatar_url,
            google_id  = EXCLUDED.google_id,
            updated_at = now()
        `
        return true
      } catch {
        return false
      }
    },

    async jwt({ token, account }) {
      // On first sign-in (account present), load internal user id + role
      if (account && token.email) {
        const [dbUser] = await sql<{ id: string; role: string }[]>`
          SELECT id, role FROM users WHERE email = ${token.email}
        `
        if (dbUser) {
          token.userId = dbUser.id
          token.role = dbUser.role
        }
      }
      return token
    },

    async session({ session, token }) {
      session.user.id = (token.userId as string) ?? ''
      session.user.role = (token.role as UserRole) ?? 'guest'
      return session
    },
  },
})
