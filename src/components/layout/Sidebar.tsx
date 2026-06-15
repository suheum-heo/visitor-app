'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, CalendarCheck, LayoutDashboard, DoorOpen, Search, BarChart3, Plane } from 'lucide-react'
import { hasPermission } from '@/lib/auth/permissions'
import type { UserRole } from '@/types'
import { cn } from '@/lib/utils'
import type { User } from '@/types'

const navItems = [
  { href: '/', label: '대시보드', icon: LayoutDashboard, permission: null },
  { href: '/visitors', label: '방문객 관리', icon: Users, permission: null },
  { href: '/meetings', label: '미팅 관리', icon: CalendarCheck, permission: null },
  { href: '/trips', label: '출장 관리', icon: Plane, permission: 'trips.read.own' as const },
  { href: '/access-records', label: '출입 기록', icon: DoorOpen, permission: null },
  { href: '/search', label: '통합 검색', icon: Search, permission: null },
  { href: '/reports', label: '보고서', icon: BarChart3, permission: 'reports.read' as const },
]

export default function Sidebar({ user }: { user: User }) {
  const pathname = usePathname()
  const role = user.role as UserRole

  const visibleItems = navItems.filter((item) => {
    if (!item.permission) return true
    if (item.permission === 'trips.read.own') {
      return hasPermission(role, 'trips.read.own') || hasPermission(role, 'trips.read.all')
    }
    return hasPermission(role, item.permission)
  })

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <span className="font-bold text-gray-900 text-sm">방문·미팅·출장 관리</span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === href || (href !== '/' && pathname.startsWith(href))
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
        {user.name ?? user.email}
      </div>
    </aside>
  )
}
