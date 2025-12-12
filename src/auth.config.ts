import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
    trustHost: true,
    pages: {
        signIn: '/login',
    },
    // Use unique cookie names to prevent conflicts with other apps on localhost
    cookies: {
        sessionToken: {
            name: 'apphub.session-token',
            options: {
                httpOnly: true,
                sameSite: 'lax' as const,
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
        callbackUrl: {
            name: 'apphub.callback-url',
            options: {
                sameSite: 'lax' as const,
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
        csrfToken: {
            name: 'apphub.csrf-token',
            options: {
                httpOnly: true,
                sameSite: 'lax' as const,
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            
            // Public paths that don't require authentication
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
                '/.well-known',
                '/auth-callback'
            ]
            
            const isPublicPath = publicPaths.some(path => nextUrl.pathname.startsWith(path))

            // Allow access to public paths
            if (isPublicPath) {
                if (isLoggedIn) {
                    // Redirect authenticated users if they visit login/register pages
                    if (nextUrl.pathname === '/login' || nextUrl.pathname === '/register') {
                        // Check for callbackUrl (e.g., OAuth flow)
                        const callbackUrl = nextUrl.searchParams.get('callbackUrl')
                        if (callbackUrl) {
                            // Redirect to the callback URL (e.g., OAuth authorize endpoint)
                            return Response.redirect(new URL(callbackUrl, nextUrl.origin))
                        }
                        return Response.redirect(new URL('/', nextUrl))
                    }
                }
                return true
            }

            // Protected routes (dashboard and others)
            if (!isLoggedIn) {
                return false // Trigger redirect to login page (configured in pages.signIn)
            }

            return true
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig
