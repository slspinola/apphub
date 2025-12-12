# AppHub OAuth/OIDC Integration Guide

Complete guide for integrating third-party applications with AppHub using OAuth 2.0 / OpenID Connect authentication.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [App Registration in AppHub](#app-registration-in-apphub)
4. [Environment Configuration](#environment-configuration)
5. [NextAuth v5 Implementation](#nextauth-v5-implementation)
6. [File Structure](#file-structure)
7. [Step-by-Step Implementation](#step-by-step-implementation)
8. [Session Data and Claims](#session-data-and-claims)
9. [SSO Implementation](#sso-implementation)
10. [Cookie Configuration (Critical)](#cookie-configuration-critical)
11. [Error Handling](#error-handling)
12. [Troubleshooting](#troubleshooting)
13. [Security Best Practices](#security-best-practices)

---

## Overview

AppHub provides an OAuth 2.0 / OpenID Connect (OIDC) compliant authentication system that allows third-party applications to:

- Authenticate users via AppHub single sign-on (SSO)
- Access user profile information (name, email)
- Access organization/entity context (entity ID, name, slug)
- Access role and permission information
- Receive licensed apps list for the user's entity

### Authentication Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Your App      │     │     AppHub      │     │     User        │
│   (Client)      │     │   (Provider)    │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  1. User visits app   │                       │
         │<──────────────────────│───────────────────────│
         │                       │                       │
         │  2. Redirect to AppHub /oauth/authorize       │
         │───────────────────────>                       │
         │                       │                       │
         │                       │  3. Show login form   │
         │                       │──────────────────────>│
         │                       │                       │
         │                       │  4. User authenticates│
         │                       │<──────────────────────│
         │                       │                       │
         │  5. Redirect with authorization code          │
         │<──────────────────────│                       │
         │                       │                       │
         │  6. Exchange code for tokens (POST /oauth/token)
         │───────────────────────>                       │
         │                       │                       │
         │  7. Return access_token, id_token             │
         │<──────────────────────│                       │
         │                       │                       │
         │  8. Create session, user logged in            │
         │───────────────────────│───────────────────────>
         │                       │                       │
```

---

## Prerequisites

### For Your Application

- **Next.js 14+** (App Router recommended)
- **NextAuth v5** (Auth.js) - `next-auth@^5.0.0-beta.30` or later
- **TypeScript** (recommended for type safety)

### From AppHub

You will need the following from AppHub administrator:

1. **Client ID** - Unique identifier for your app
2. **Client Secret** - Secret key for token exchange (keep secure!)
3. **AppHub URL** - The base URL of the AppHub instance

---

## App Registration in AppHub

Before implementing authentication, your app must be registered in AppHub:

1. **Admin Access**: Contact AppHub administrator
2. **Provide App Details**:
   - App name and description
   - Redirect URI: `{YOUR_APP_URL}/api/auth/callback/apphub`
   - Requested scopes (typically: `openid profile email organization`)
3. **Receive Credentials**:
   - Client ID (e.g., `myapp_client_abc123`)
   - Client Secret (e.g., `secret_live_xyz789...`)

---

## Environment Configuration

Create a `.env.local` file in your app root with the following variables:

```env
# =============================================================================
# AppHub OAuth Configuration
# =============================================================================

# Base URL of the AppHub instance
# Development: http://localhost:3000
# Production: https://your-apphub-domain.com
APPHUB_URL="http://localhost:3000"

# OAuth Client Credentials (from AppHub registration)
APPHUB_CLIENT_ID="your_app_client_id"
APPHUB_CLIENT_SECRET="your_app_client_secret"

# =============================================================================
# NextAuth Configuration
# =============================================================================

# Secret for JWT encryption - generate with: openssl rand -base64 32
# CRITICAL: Use a DIFFERENT secret than AppHub's AUTH_SECRET
AUTH_SECRET="your-unique-random-secret-here"

# Your application's base URL
# Development: http://localhost:3001 (or your dev port)
# Production: https://your-app-domain.com
NEXTAUTH_URL="http://localhost:3001"
```

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `APPHUB_URL` | Yes | Base URL of AppHub OAuth provider |
| `APPHUB_CLIENT_ID` | Yes | OAuth client identifier from AppHub |
| `APPHUB_CLIENT_SECRET` | Yes | OAuth client secret from AppHub |
| `AUTH_SECRET` | Yes | Unique secret for JWT encryption |
| `NEXTAUTH_URL` | Yes | Your application's base URL |

---

## NextAuth v5 Implementation

### File Structure

```
your-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts       # NextAuth API route
│   │   ├── login/
│   │   │   └── page.tsx              # Login/SSO redirect page
│   │   ├── error/
│   │   │   └── page.tsx              # OAuth error handling
│   │   └── page.tsx                  # Protected home page
│   ├── types/
│   │   └── next-auth.d.ts            # TypeScript type extensions
│   ├── auth.ts                       # NextAuth configuration
│   └── middleware.ts                 # Route protection
├── .env.local                        # Environment variables
└── package.json
```

---

## Step-by-Step Implementation

### Step 1: Install Dependencies

```bash
npm install next-auth@^5.0.0-beta.30
```

### Step 2: Create Auth Configuration (`src/auth.ts`)

This is the core authentication configuration file:

```typescript
import NextAuth from 'next-auth'

// AppHub OIDC Provider Configuration
const appHubProvider = {
  id: 'apphub',
  name: 'AppHub',
  type: 'oidc' as const,
  issuer: process.env.APPHUB_URL,
  clientId: process.env.APPHUB_CLIENT_ID!,
  clientSecret: process.env.APPHUB_CLIENT_SECRET!,

  // Request organization scope for entity data
  authorization: {
    params: {
      scope: 'openid profile email organization',
    },
  },

  // CRITICAL: AppHub requires client_secret in POST body, not Authorization header
  token: {
    params: {
      client_id: process.env.APPHUB_CLIENT_ID!,
      client_secret: process.env.APPHUB_CLIENT_SECRET!,
    },
  },
  client: {
    token_endpoint_auth_method: 'client_secret_post',
  },

  // Map AppHub profile to NextAuth user
  profile(profile: Record<string, unknown>) {
    return {
      id: profile.sub as string,
      name: profile.name as string,
      email: profile.email as string,
      image: profile.picture as string | null,
      // AppHub-specific fields
      entityId: profile.entity_id as string,
      entityName: profile.entity_name as string,
      entitySlug: profile.entity_slug as string,
      role: profile.role as string,
    }
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [appHubProvider],
  trustHost: true,

  // CRITICAL: Unique cookie names to prevent conflicts with AppHub
  // See "Cookie Configuration" section for details
  cookies: {
    sessionToken: {
      name: 'yourapp.session-token',  // Replace 'yourapp' with your app name
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: 'yourapp.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: 'yourapp.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  callbacks: {
    // Persist AppHub data to JWT token
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 3600 * 1000

        // AppHub claims from the ID token/profile
        token.entityId = profile.entity_id
        token.entityName = profile.entity_name
        token.entitySlug = profile.entity_slug
        token.role = profile.role
        token.permissions = profile.permissions
        token.scopes = profile.scopes
        token.licensedApps = profile.licensed_apps
      }
      return token
    },

    // Expose data to client session
    async session({ session, token }) {
      if (token && session.user) {
        session.accessToken = token.accessToken as string
        session.user.id = token.sub as string
        session.user.entityId = token.entityId as string
        session.user.entityName = token.entityName as string
        session.user.entitySlug = token.entitySlug as string
        session.user.role = token.role as string
        session.user.permissions = (token.permissions as string[]) || []
        session.user.scopes = (token.scopes as Record<string, unknown>) || {}
        session.user.licensedApps = (token.licensedApps as string[]) || []
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/error',
  },
})
```

### Step 3: Create API Route (`src/app/api/auth/[...nextauth]/route.ts`)

```typescript
import { handlers } from '@/auth'

export const { GET, POST } = handlers
```

### Step 4: Create TypeScript Types (`src/types/next-auth.d.ts`)

Extend the NextAuth types to include AppHub-specific fields:

```typescript
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      entityId: string
      entityName: string
      entitySlug: string
      role: string
      permissions: string[]
      scopes: Record<string, unknown>
      licensedApps: string[]
    }
  }

  interface Profile {
    sub: string
    name?: string
    email?: string
    picture?: string
    entity_id?: string
    entity_name?: string
    entity_slug?: string
    role?: string
    permissions?: string[]
    scopes?: Record<string, unknown>
    licensed_apps?: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
    entityId?: string
    entityName?: string
    entitySlug?: string
    role?: string
    permissions?: string[]
    scopes?: Record<string, unknown>
    licensedApps?: string[]
  }
}
```

### Step 5: Create Middleware (`src/middleware.ts`)

Protect routes from unauthenticated access:

```typescript
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/register', '/api/auth', '/_next', '/favicon.ico', '/error']
  const isPublicPath = publicPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  )

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### Step 6: Create Login Page with SSO (`src/app/login/page.tsx`)

For seamless SSO experience, auto-redirect users to AppHub:

```typescript
'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function LoginContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const error = searchParams.get('error')
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Auto-redirect to AppHub OAuth for SSO experience (unless there's an error)
  useEffect(() => {
    if (!error && !isRedirecting) {
      setIsRedirecting(true)
      signIn('apphub', { callbackUrl })
    }
  }, [error, callbackUrl, isRedirecting])

  // Show error state with retry button
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div>
            <h2 className="text-center text-3xl font-bold text-gray-900">
              Your App Name
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Sign in with your AppHub account
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="text-sm">
              {error === 'OAuthSignin' && 'Error starting OAuth sign-in'}
              {error === 'OAuthCallback' && 'Error during OAuth callback'}
              {error === 'OAuthCreateAccount' && 'Error creating account'}
              {error === 'AccessDenied' && 'Access denied'}
              {error === 'Callback' && 'Error during callback'}
              {error === 'Configuration' && 'Server configuration error'}
              {!['OAuthSignin', 'OAuthCallback', 'OAuthCreateAccount',
                 'AccessDenied', 'Callback', 'Configuration'].includes(error) && error}
            </p>
          </div>

          <button
            onClick={() => signIn('apphub', { callbackUrl })}
            className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm
                       text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Try again with AppHub
          </button>
        </div>
      </div>
    )
  }

  // Loading state while redirecting to AppHub
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md text-center">
        <h2 className="text-3xl font-bold text-gray-900">Your App Name</h2>
        <p className="text-sm text-gray-600">
          Redirecting to AppHub for authentication...
        </p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
```

### Step 7: Create Error Page (`src/app/error/page.tsx`)

```typescript
'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.'
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.'
      case 'Verification':
        return 'The verification token has expired or has already been used.'
      case 'OAuthSignin':
        return 'Error starting OAuth sign-in flow.'
      case 'OAuthCallback':
        return 'Error handling OAuth callback.'
      case 'OAuthCreateAccount':
        return 'Could not create OAuth account.'
      case 'Callback':
        return 'Error during authentication callback.'
      default:
        return 'An unexpected error occurred during authentication.'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {getErrorMessage(error)}
          </p>
          {error && (
            <p className="mt-2 text-xs text-gray-400">
              Error code: {error}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Link
            href="/login"
            className="w-full flex justify-center py-2 px-4 border border-transparent
                       rounded-md shadow-sm text-sm font-medium text-white
                       bg-blue-600 hover:bg-blue-700"
          >
            Try again
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  )
}
```

### Step 8: Use Session in Pages

Server Component example:

```typescript
import { auth, signOut } from '@/auth'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}!</h1>
      <p>Email: {session.user.email}</p>
      <p>Entity: {session.user.entityName}</p>
      <p>Role: {session.user.role}</p>

      <form
        action={async () => {
          'use server'
          await signOut({ redirectTo: '/login' })
        }}
      >
        <button type="submit">Sign out</button>
      </form>
    </div>
  )
}
```

Client Component example:

```typescript
'use client'

import { useSession, signOut } from 'next-auth/react'

export default function UserProfile() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    return <div>Not authenticated</div>
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}!</h1>
      <p>Entity: {session.user.entityName}</p>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  )
}
```

---

## Session Data and Claims

After successful authentication, the following data is available in the session:

### User Information

| Field | Type | Description |
|-------|------|-------------|
| `user.id` | string | User's unique identifier (UUID) |
| `user.name` | string | User's display name |
| `user.email` | string | User's email address |
| `user.image` | string? | Profile image URL |

### Entity (Organization) Context

| Field | Type | Description |
|-------|------|-------------|
| `user.entityId` | string | Current entity's unique identifier |
| `user.entityName` | string | Entity display name |
| `user.entitySlug` | string | URL-friendly entity identifier |

### Role and Permissions

| Field | Type | Description |
|-------|------|-------------|
| `user.role` | string | User's role (e.g., "admin", "member") |
| `user.permissions` | string[] | List of permission strings |
| `user.scopes` | object | OAuth scopes granted |
| `user.licensedApps` | string[] | Apps licensed for this entity |

### Access Token

| Field | Type | Description |
|-------|------|-------------|
| `accessToken` | string | JWT access token for API calls |

---

## Cookie Configuration (Critical)

### Why Custom Cookie Names Are Required

When running multiple NextAuth apps on the same domain (e.g., `localhost`), they share cookies by **domain**, not by port. If both AppHub and your app use default cookie names (`authjs.session-token`), they will **overwrite each other's sessions**.

### Symptoms of Cookie Conflict

- Login to your app logs you out of AppHub
- Login to AppHub logs you out of your app
- Sessions don't persist after OAuth redirect

### Solution

Each app MUST use unique cookie name prefixes:

```typescript
// In your app's auth.ts
cookies: {
  sessionToken: {
    name: 'yourapp.session-token',  // NOT 'authjs.session-token'
    options: { ... }
  },
  callbackUrl: {
    name: 'yourapp.callback-url',
    options: { ... }
  },
  csrfToken: {
    name: 'yourapp.csrf-token',
    options: { ... }
  },
}
```

### Naming Convention

Use your app's name/slug as the cookie prefix:

| App | Cookie Prefix |
|-----|---------------|
| AppHub | `apphub.` |
| Bee2App | `bee2app.` |
| Your App | `yourapp.` |

---

## Error Handling

### Common Errors and Solutions

| Error Code | Cause | Solution |
|------------|-------|----------|
| `Configuration` | Server misconfiguration | Check `APPHUB_URL`, credentials |
| `OAuthSignin` | OAuth start failed | Verify `client_id` is correct |
| `OAuthCallback` | Callback processing failed | Check redirect URI configuration |
| `AccessDenied` | User not authorized | Verify user has app license |

### Token Endpoint Requirements

AppHub requires `client_secret` in the POST body, NOT the Authorization header. Ensure you have:

```typescript
token: {
  params: {
    client_id: process.env.APPHUB_CLIENT_ID!,
    client_secret: process.env.APPHUB_CLIENT_SECRET!,
  },
},
client: {
  token_endpoint_auth_method: 'client_secret_post',
},
```

---

## Troubleshooting

### 1. "Configuration" Error on Callback

**Check:**
- APPHUB_URL is correct and accessible
- Client ID and Secret are correct
- Token endpoint auth method is `client_secret_post`

### 2. Sessions Keep Getting Invalidated

**Solution:** Configure unique cookie names (see Cookie Configuration section)

### 3. OIDC Discovery Fails

**Verify:** AppHub's OIDC discovery endpoint is accessible:
```bash
curl {APPHUB_URL}/.well-known/openid-configuration
```

### 4. Access Token Not Present

**Check:**
- Requested scopes include `openid`
- JWT callback is correctly storing `account.access_token`

### 5. Entity Data Missing

**Check:**
- Requested scopes include `organization`
- Profile callback maps `entity_id`, `entity_name`, etc.

---

## Security Best Practices

1. **Never expose `APPHUB_CLIENT_SECRET`** in client-side code
2. **Use different `AUTH_SECRET`** than AppHub
3. **Enable HTTPS** in production (`secure: true` for cookies)
4. **Validate session** on sensitive operations
5. **Use `httpOnly` cookies** to prevent XSS attacks
6. **Implement CSRF protection** (NextAuth handles this)
7. **Regular secret rotation** for production environments

---

## AppHub OIDC Endpoints Reference

| Endpoint | URL | Description |
|----------|-----|-------------|
| Discovery | `/.well-known/openid-configuration` | OIDC configuration |
| JWKS | `/.well-known/jwks.json` | JSON Web Key Set |
| Authorization | `/oauth/authorize` | OAuth authorize endpoint |
| Token | `/oauth/token` | Token exchange endpoint |
| Userinfo | `/oauth/userinfo` | User information endpoint |

---

## Support

For issues with:
- **AppHub OAuth Provider**: Contact AppHub administrator
- **Your App Integration**: Review this documentation and troubleshooting section
- **NextAuth Configuration**: See [NextAuth.js Documentation](https://authjs.dev)

---

*Last Updated: December 2025*
*AppHub Version: 0.1.0*
*NextAuth Version: 5.0.0-beta.30+*
