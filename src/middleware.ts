import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { validateSessionUser } from './lib/auth-utils'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Debug logging to check environment in Vercel logs
// NextAuth v5 uses AUTH_SECRET, not NEXTAUTH_SECRET
if (!process.env.AUTH_SECRET) {
  console.error('CRITICAL ERROR: AUTH_SECRET is missing from environment variables!')
  console.error('NextAuth v5 requires AUTH_SECRET for JWT encryption/decryption.')
  console.error('Generate one with: openssl rand -base64 32')
}

const { auth } = NextAuth(authConfig)

export default auth(async function middleware(req: NextRequest) {
    const session = req.auth

    // Public paths that don't require authentication or validation
    const publicPaths = [
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/verify-email',
        '/resend-verification',
        '/invite',
        '/oauth',
        '/api',
        '/.well-known'
    ]
    
    const isPublicPath = publicPaths.some(path => req.nextUrl.pathname.startsWith(path))

    // Skip validation for public paths
    if (isPublicPath) {
        return NextResponse.next()
    }

    // For protected routes without a session, redirect to login
    if (!session) {
        const loginUrl = new URL('/login', req.url)
        return NextResponse.redirect(loginUrl)
    }

    // If session exists but has no user ID, let NextAuth handle it
    // (this is an incomplete/malformed session)
    if (!session.user?.id) {
        return NextResponse.next()
    }

    // Validate that the session user exists in the database
    const userExists = await validateSessionUser(session)
    
    if (!userExists) {
        console.warn(`Session user ${session.user.id} not found in database - forcing logout`)
        
        // Clear the session and redirect to login
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('error', 'SessionExpired')
        loginUrl.searchParams.set('message', 'Your session has expired. Please log in again.')
        
        const response = NextResponse.redirect(loginUrl)
        
        // Clear the session cookie (using custom cookie name)
        response.cookies.delete('apphub.session-token')
        response.cookies.delete('__Secure-apphub.session-token')
        
        return response
    }

    return NextResponse.next()
})

export const config = {
    // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
