// API route to clear stale session cookies
import { NextResponse } from 'next/server'

export async function GET() {
  const response = NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL || 'http://localhost:3000'))

  // Clear all possible NextAuth session cookies
  const cookieNames = [
    'authjs.session-token',
    '__Secure-authjs.session-token',
    'authjs.csrf-token',
    '__Host-authjs.csrf-token',
    'authjs.callback-url',
    '__Secure-authjs.callback-url',
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.csrf-token',
    'next-auth.callback-url',
  ]

  for (const name of cookieNames) {
    response.cookies.delete(name)
  }

  return response
}
