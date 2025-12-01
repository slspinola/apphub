import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

// Debug logging to check environment in Vercel logs
if (!process.env.NEXTAUTH_SECRET) {
  console.error('CRITICAL ERROR: NEXTAUTH_SECRET is missing from environment variables!')
}

export default NextAuth(authConfig).auth

export const config = {
    // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
