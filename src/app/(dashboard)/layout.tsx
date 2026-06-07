import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import type { User } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [user] = await sql<User[]>`
    SELECT * FROM users WHERE id = ${session.user.id}
  `
  if (!user) redirect('/login')

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
