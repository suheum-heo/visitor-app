import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl
  const isPublic =
    pathname.startsWith('/api/auth') ||
    pathname === '/api/health' ||
    pathname.startsWith('/api/cron/') ||
    pathname === '/login' ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'

  if (!req.auth && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  if (req.auth && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
