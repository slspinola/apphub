# AppHub Integration Specification & Implementation Guide

This document provides **everything needed** to integrate an application with AppHub's OAuth 2.0 / OpenID Connect provider. It is designed to be handed to developers or AI coding assistants.

---

## Part 1: Specification

### 1.1 What is AppHub?

AppHub is a **centralized identity and access management hub** that acts as an **OAuth 2.0 / OpenID Connect (OIDC) Provider** for ecosystem applications.

**Key capabilities**:
- Single Sign-On (SSO) across all connected apps
- Multi-tenant architecture (users belong to **Entities** / organizations)
- Role-Based Access Control (RBAC) with hierarchical roles
- Per-app permissions and data scopes
- App licensing per entity

---

### 1.2 Core Concepts

| Concept | Description |
|---------|-------------|
| **Entity** | Organization / tenant (company, team, department). Hierarchical. |
| **User** | Individual with an account. Belongs to one or more entities via memberships. |
| **Membership** | Relationship between a user and an entity, with an assigned role. |
| **Role** | User's role within an entity: `owner`, `admin`, `manager`, `member`. |
| **Permission** | Granular action authorization (e.g. `vehicles:read`, `reports:export`). |
| **Scope** | Data-level access restriction per app (e.g. limited to specific customers). |
| **License** | Entity's subscription to an app with a specific plan. |
| **App** | A registered application in the AppHub ecosystem. |

---

### 1.3 Endpoints Reference

All endpoints are relative to `{APPHUB_URL}` (e.g. `https://hub.example.com`).

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/.well-known/openid-configuration` | GET | OIDC discovery document |
| `/.well-known/jwks.json` | GET | Public keys for JWT verification |
| `/oauth/authorize` | GET | Start authorization flow |
| `/oauth/token` | POST | Exchange code for tokens / refresh tokens |
| `/oauth/userinfo` | GET/POST | Get user profile from access token |
| `/oauth/revoke` | POST | Revoke a refresh token |

---

### 1.4 OAuth Flow: Authorization Code with PKCE

**PKCE is required** for all authorization requests.

```text
┌──────────────┐                                    ┌──────────────┐
│  Your App    │                                    │   AppHub     │
│  (Client)    │                                    │  (Provider)  │
└──────┬───────┘                                    └──────┬───────┘
       │                                                   │
       │ 1. Generate code_verifier (random string)         │
       │    Derive code_challenge = SHA256(code_verifier)  │
       │                                                   │
       │ 2. Redirect user to /oauth/authorize              │
       │    ?client_id=...                                 │
       │    &redirect_uri=...                              │
       │    &response_type=code                            │
       │    &scope=openid profile email organization       │
       │    &state=...                                     │
       │    &code_challenge=...                            │
       │    &code_challenge_method=S256                    │
       │ ─────────────────────────────────────────────────>│
       │                                                   │
       │                   3. User logs in & consents      │
       │                                                   │
       │ 4. Redirect back to redirect_uri                  │
       │    ?code=AUTHORIZATION_CODE&state=...             │
       │<───────────────────────────────────────────────── │
       │                                                   │
       │ 5. POST /oauth/token                              │
       │    grant_type=authorization_code                  │
       │    code=AUTHORIZATION_CODE                        │
       │    redirect_uri=...                               │
       │    client_id=...                                  │
       │    client_secret=...                              │
       │    code_verifier=...                              │
       │ ─────────────────────────────────────────────────>│
       │                                                   │
       │ 6. Response: { access_token, refresh_token,       │
       │               id_token, expires_in, scope }       │
       │<───────────────────────────────────────────────── │
       │                                                   │
```

---

### 1.5 Token Refresh Flow

```text
┌──────────────┐                                    ┌──────────────┐
│  Your App    │                                    │   AppHub     │
└──────┬───────┘                                    └──────┬───────┘
       │                                                   │
       │ POST /oauth/token                                 │
       │   grant_type=refresh_token                        │
       │   refresh_token=...                               │
       │   client_id=...                                   │
       │   client_secret=...                               │
       │ ─────────────────────────────────────────────────>│
       │                                                   │
       │ Response: { access_token, refresh_token,          │
       │            id_token, expires_in, scope }          │
       │<───────────────────────────────────────────────── │
       │                                                   │
```

**Note**: AppHub implements **refresh token rotation** – each refresh returns a new refresh token and invalidates the old one.

---

### 1.6 Access Token Structure (JWT)

The access token is a **JWT signed with RS256**. Verify using the JWKS endpoint.

**Payload structure**:

```json
{
  // Standard OIDC/OAuth claims
  "iss": "https://hub.example.com",
  "sub": "user_abc123",
  "aud": ["your-app-slug"],
  "exp": 1699999999,
  "iat": 1699996399,
  "jti": "at_unique_token_id",

  // User identity
  "email": "user@example.com",
  "name": "John Doe",
  "image": "https://cdn.example.com/avatar.jpg",

  // Tenant context
  "entity_id": "entity_org123",
  "entity_name": "Acme Corporation",
  "entity_slug": "acme-corp",

  // Role & permissions
  "role": "admin",
  "permissions": [
    "vehicles:read",
    "vehicles:write",
    "drivers:read",
    "reports:export"
  ],

  // Data scopes (per-app)
  "scopes": {
    "your-app-slug": {
      "type": "customer",
      "value": {
        "customer_id": "cust_123",
        "customer_name": "Customer XYZ"
      }
    }
  },

  // Licensing
  "licensed_apps": ["your-app-slug", "another-app"],

  // Impersonation (if applicable)
  "impersonated_by": null
}
```

---

### 1.7 ID Token Structure (JWT)

Simpler identity token for OIDC:

```json
{
  "iss": "https://hub.example.com",
  "sub": "user_abc123",
  "aud": "your_client_id",
  "exp": 1699999999,
  "iat": 1699996399,
  "auth_time": 1699996399,

  "email": "user@example.com",
  "email_verified": true,
  "name": "John Doe",
  "picture": "https://cdn.example.com/avatar.jpg",

  "entity_id": "entity_org123",
  "entity_name": "Acme Corporation",
  "entity_slug": "acme-corp",
  "role": "admin"
}
```

---

### 1.8 Role Hierarchy

```text
┌─────────────────────────────────────────────────────────┐
│                       OWNER                              │
│  • Full control of entity and all sub-entities          │
│  • Can delete entity, transfer ownership                │
├─────────────────────────────────────────────────────────┤
│                       ADMIN                              │
│  • Manage entity settings, members, sub-entities        │
│  • Cannot delete entity                                  │
├─────────────────────────────────────────────────────────┤
│                      MANAGER                             │
│  • View/edit sub-entities only                          │
│  • No parent entity management                           │
├─────────────────────────────────────────────────────────┤
│                       MEMBER                             │
│  • Basic access, view only                               │
│  • No management permissions                             │
└─────────────────────────────────────────────────────────┘
```

---

### 1.9 Scopes (OAuth scopes vs Data scopes)

**OAuth scopes** (requested during authorization):
- `openid` – Required for OIDC
- `profile` – User name and picture
- `email` – User email
- `organization` – Entity/tenant information

**Data scopes** (in token `scopes` claim):
- Per-app data access restrictions
- Types: `full_access`, `customer`, `customers`, `region`, `entity_ids`, `custom`
- Your app must filter database queries based on the scope value

---

### 1.10 Security Requirements

| Requirement | Description |
|-------------|-------------|
| **HTTPS** | All production traffic must use TLS 1.2+ |
| **Secret storage** | Store `clientSecret` in environment variables or secure vault |
| **No token logging** | Never log access tokens, refresh tokens, or secrets |
| **Token validation** | Always verify JWT signature, issuer, audience, and expiry |
| **License check** | Verify your app slug is in `licensed_apps` |
| **PKCE required** | Always use `code_challenge` with `S256` method |
| **State parameter** | Always use random `state` for CSRF protection |

---

## Part 2: Implementation Guide

### 2.1 Prerequisites

Before implementing, ensure you have:

1. **App registered in AppHub** with:
   - `slug` – unique identifier (e.g. `fleet-manager`)
   - `baseUrl` – your app's URL
   
2. **OAuth credentials** from AppHub:
   - `clientId`
   - `clientSecret` (shown once, store securely)
   
3. **Redirect URIs registered** in AppHub:

   ```text
   https://yourapp.com/api/auth/callback/apphub
   http://localhost:3000/api/auth/callback/apphub  (for dev)
   ```

---

### 2.2 Environment Variables

Set these in your application:

```env
# AppHub OAuth Configuration
APPHUB_URL=https://hub.example.com
APPHUB_CLIENT_ID=your_app_client_abc123def456
APPHUB_CLIENT_SECRET=secret_live_xyz789...

# Your App Configuration
NEXTAUTH_URL=https://yourapp.com
NEXTAUTH_SECRET=your-nextauth-secret-here

# Your App Identifier (must match slug in AppHub)
APP_SLUG=your-app-slug
```

---

### 2.3 Next.js + NextAuth Implementation

#### `auth.ts` (or `auth.config.ts`)

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
  authorization: {
    params: {
      scope: 'openid profile email organization',
    },
  },
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
  callbacks: {
    async jwt({ token, account, profile }) {
      // On initial sign-in, persist AppHub data to the JWT
      if (account && profile) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 3600 * 1000

        // AppHub claims
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
    async session({ session, token }) {
      // Expose AppHub data to the client session
      if (token && session.user) {
        session.accessToken = token.accessToken as string
        session.user.id = token.sub as string
        session.user.entityId = token.entityId as string
        session.user.entityName = token.entityName as string
        session.user.entitySlug = token.entitySlug as string
        session.user.role = token.role as string
        session.user.permissions = token.permissions as string[]
        session.user.scopes = token.scopes as Record<string, unknown>
        session.user.licensedApps = token.licensedApps as string[]
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
```

#### TypeScript Types (`types/next-auth.d.ts`)

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
      scopes: Record<string, { type: string; value: unknown }>
      licensedApps: string[]
    }
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

---

### 2.4 Protected API Route Example

```typescript
// app/api/vehicles/route.ts
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check license
  if (!session.user.licensedApps.includes('your-app-slug')) {
    return NextResponse.json(
      { error: 'Entity not licensed for this app' },
      { status: 403 }
    )
  }

  // Check permission
  if (!session.user.permissions.includes('vehicles:read')) {
    return NextResponse.json(
      { error: 'Missing permission: vehicles:read' },
      { status: 403 }
    )
  }

  // Apply scope filter to database query
  const scope = session.user.scopes?.['your-app-slug']
  let whereClause: Record<string, unknown> = {
    entityId: session.user.entityId, // Always filter by entity
  }

  if (scope?.type === 'customer' && scope?.value?.customer_id) {
    whereClause.customerId = scope.value.customer_id
  }

  // Execute query with filters
  const vehicles = await prisma.vehicle.findMany({ where: whereClause })

  return NextResponse.json(vehicles)
}
```

---

### 2.5 Middleware for Route Protection

```typescript
// middleware.ts
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth

  const publicPaths = ['/login', '/register', '/api/auth', '/_next', '/favicon.ico']
  const isPublicPath = publicPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  )

  if (!isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

### 2.6 Permission Check Utilities

```typescript
// lib/auth-utils.ts

export type EntityRole = 'owner' | 'admin' | 'manager' | 'member'

const ROLE_HIERARCHY: Record<EntityRole, number> = {
  owner: 4,
  admin: 3,
  manager: 2,
  member: 1,
}

export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  return userPermissions.includes(requiredPermission)
}

export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.some((p) => userPermissions.includes(p))
}

export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.every((p) => userPermissions.includes(p))
}

export function hasRole(userRole: EntityRole, minimumRole: EntityRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole]
}

export function isAdmin(userRole: EntityRole): boolean {
  return hasRole(userRole, 'admin')
}

export function isOwner(userRole: EntityRole): boolean {
  return userRole === 'owner'
}
```

---

### 2.7 Scope Filter Utility

```typescript
// lib/scope-utils.ts

interface ScopeValue {
  type: string
  value: Record<string, unknown> | null
}

interface ScopeFilterConfig {
  customer?: string   // DB field name for customer ID
  customers?: string  // DB field name for multiple customers
  region?: string     // DB field name for region
  entityIds?: string  // DB field name for entity IDs
}

export function applyScopeFilter<T extends Record<string, unknown>>(
  where: T,
  scope: ScopeValue | null | undefined,
  config: ScopeFilterConfig
): T {
  if (!scope || scope.type === 'full_access') {
    return where
  }

  const result = { ...where }

  switch (scope.type) {
    case 'customer':
      if (config.customer && scope.value?.customer_id) {
        (result as Record<string, unknown>)[config.customer] = scope.value.customer_id
      }
      break

    case 'customers':
      if (config.customers && scope.value?.customer_ids) {
        (result as Record<string, unknown>)[config.customers] = {
          in: scope.value.customer_ids,
        }
      }
      break

    case 'region':
      if (config.region && scope.value?.region) {
        (result as Record<string, unknown>)[config.region] = scope.value.region
      }
      break

    case 'entity_ids':
      if (config.entityIds && scope.value?.ids) {
        (result as Record<string, unknown>)[config.entityIds] = {
          in: scope.value.ids,
        }
      }
      break

    default:
      // Custom scope: merge all value fields
      if (scope.value) {
        Object.assign(result, scope.value)
      }
  }

  return result
}
```

---

## Part 3: AI Implementation Prompt

Copy and paste the following prompt to an AI assistant (like Claude or GPT) to implement AppHub integration:

---

### Prompt for AI Assistant

```text
I need to integrate my application with AppHub, which is an OAuth 2.0 / OpenID Connect provider.

## My App Details
- App name: [YOUR_APP_NAME]
- App slug (registered in AppHub): [YOUR_APP_SLUG]
- Framework: [Next.js 14 with App Router / Other - specify]
- Auth library: [NextAuth.js v5 / Other - specify]

## AppHub Configuration
- AppHub URL: [APPHUB_URL, e.g., https://hub.example.com]
- Client ID: [Will be in env var APPHUB_CLIENT_ID]
- Client Secret: [Will be in env var APPHUB_CLIENT_SECRET]
- Redirect URI: [YOUR_APP_URL]/api/auth/callback/apphub

## AppHub Endpoints
AppHub provides standard OIDC endpoints:
- Discovery: {APPHUB_URL}/.well-known/openid-configuration
- JWKS: {APPHUB_URL}/.well-known/jwks.json
- Authorization: {APPHUB_URL}/oauth/authorize
- Token: {APPHUB_URL}/oauth/token
- UserInfo: {APPHUB_URL}/oauth/userinfo
- Revocation: {APPHUB_URL}/oauth/revoke

Required OAuth scopes: openid profile email organization
PKCE is required (code_challenge_method=S256)

## AppHub Access Token Claims
The JWT access token includes these claims that I need to use:
- sub: user ID
- email, name, image: user identity
- entity_id, entity_name, entity_slug: tenant/organization info
- role: user's role (owner, admin, manager, member)
- permissions: array of permission strings (e.g., "vehicles:read")
- scopes: per-app data access scopes with structure { type, value }
- licensed_apps: array of app slugs the entity is licensed for

## What I Need You to Implement

1. **Auth Configuration**: Set up NextAuth.js (or my auth library) to use AppHub as an OIDC provider with PKCE.

2. **Session Types**: Create TypeScript types that extend the session to include all AppHub claims (entityId, role, permissions, scopes, licensedApps).

3. **Callbacks**: Implement JWT and session callbacks to persist and expose AppHub data.

4. **Protected Routes**: Create middleware that:
   - Redirects unauthenticated users to login
   - Allows public paths (login, register, api/auth, etc.)

5. **Authorization Utilities**: Create helper functions for:
   - hasPermission(permissions, requiredPermission)
   - hasRole(role, minimumRole)
   - hasAnyPermission / hasAllPermissions

6. **Scope Filtering**: Create a utility to apply data scope filters to database queries based on the user's scope claim.

7. **Example Protected API Route**: Show how to:
   - Check if user is authenticated
   - Verify license (app slug in licensed_apps)
   - Check permission
   - Apply scope filter to query
   - Return data

8. **Login/Logout Pages**: Simple login page that triggers AppHub OAuth flow, and logout that clears session.

## Environment Variables Needed

APPHUB_URL=
APPHUB_CLIENT_ID=
APPHUB_CLIENT_SECRET=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
APP_SLUG=

Please provide complete, working code with proper TypeScript types. Follow security best practices (no token logging, proper validation, HTTPS in production).
```

---

## Part 4: Integration Checklist

Use this checklist to verify your integration is complete:

### Registration & Configuration
- [ ] App registered in AppHub with correct `slug` and `baseUrl`
- [ ] OAuth client created; `clientId` and `clientSecret` obtained
- [ ] Redirect URIs configured in AppHub (production + localhost)
- [ ] Environment variables set in your app

### Authentication Flow
- [ ] OIDC provider configured with correct issuer URL
- [ ] PKCE implemented (code_challenge + code_verifier)
- [ ] State parameter used for CSRF protection
- [ ] Scopes requested: `openid profile email organization`
- [ ] Token exchange working (code → tokens)
- [ ] Session stores all AppHub claims

### Authorization
- [ ] JWT signature verified using JWKS
- [ ] Token expiry checked
- [ ] Issuer (`iss`) validated
- [ ] Audience (`aud`) contains your app slug
- [ ] License checked (`licensed_apps` includes your app)
- [ ] Permissions enforced on protected routes
- [ ] Role hierarchy respected

### Data Scopes
- [ ] Scope claim extracted from token
- [ ] Database queries filtered by `entity_id` (always)
- [ ] Additional scope filters applied based on scope type/value
- [ ] No cross-tenant data leakage possible

### Token Refresh & Logout
- [ ] Refresh token flow implemented (optional but recommended)
- [ ] Token rotation handled (new refresh token each refresh)
- [ ] Logout clears local session
- [ ] Optional: Call `/oauth/revoke` on logout

### Security
- [ ] HTTPS used in production
- [ ] Secrets stored in environment variables
- [ ] No tokens logged anywhere
- [ ] Proper error handling without leaking sensitive info

---

This specification should give any developer or AI tool everything needed to implement a complete, secure AppHub integration.


