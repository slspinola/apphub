import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
    trustHost: true,
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            
            const publicPaths = [
                '/login',
                '/register',
                '/forgot-password',
                '/reset-password',
                '/verify-email',
                '/resend-verification'
            ]
            
            const isPublicPath = publicPaths.some(path => nextUrl.pathname.startsWith(path))

            if (isPublicPath) {
                if (isLoggedIn) {
                    // Redirect authenticated users to dashboard if they visit login/register pages
                    if (nextUrl.pathname === '/login' || nextUrl.pathname === '/register') {
                        return Response.redirect(new URL('/', nextUrl))
                    }
                }
                return true
            }

            // Protected routes (dashboard and others)
            if (!isLoggedIn) {
                return false // Redirect unauthenticated users to login page
            }

            return true
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig
