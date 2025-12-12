# @apphub/sdk

Official SDK for integrating applications with AppHub authentication and authorization system.

## Features

- 🔐 **OAuth 2.0 / OpenID Connect** - Complete PKCE flow with OIDC discovery
- 🎫 **JWT Validation** - Secure token verification with automatic key fetching
- 🔍 **Token Introspection** - Validate and inspect token metadata
- 👥 **RBAC** - Role-based access control with permission checking
- 🔭 **Scope Filtering** - Data-level access control for multi-tenancy
- 🪝 **Webhooks** - Secure webhook handling with signature verification
- 🚀 **Framework Integration** - First-class Next.js and React support

## Installation

```bash
npm install @apphub/sdk
# or
yarn add @apphub/sdk
# or
pnpm add @apphub/sdk
```

## Quick Start

### Basic Setup

```typescript
import { createAppHubClient } from '@apphub/sdk'

const apphub = createAppHubClient({
  hubUrl: process.env.APPHUB_URL!,
  clientId: process.env.APPHUB_CLIENT_ID!,
  clientSecret: process.env.APPHUB_CLIENT_SECRET!,
  appSlug: 'myapp',
  webhookSecret: process.env.APPHUB_WEBHOOK_SECRET, // optional
})

// Initialize OIDC discovery (recommended)
// This auto-configures endpoints from AppHub's discovery document
await apphub.oauth.initialize()
```

### Token Validation

```typescript
import { extractBearerToken } from '@apphub/sdk'

async function handleRequest(req: Request) {
  const token = extractBearerToken(req.headers.get('authorization'))
  
  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate token and get tenant context
  const ctx = await apphub.jwt.getTenantContext(token)
  
  // ctx contains:
  // - user: { id, email, name, image }
  // - entity: { id, name, slug }
  // - role: 'owner' | 'admin' | 'manager' | 'member'
  // - permissions: ['vehicles:read', 'vehicles:write', ...]
  // - scope: { type: 'customer', value: { customer_id: 'xxx' } }
}
```

### OAuth / OIDC Flow

```typescript
// Create authorization URL with PKCE and nonce (for OpenID Connect)
const { authorizationUrl, codeVerifier, state, nonce } = 
  await apphub.oauth.createAuthorizationUrl({
    redirectUri: 'https://myapp.com/callback',
    scopes: ['openid', 'profile', 'email', 'organization'],
  })

// Redirect user to authorizationUrl
// After callback, exchange code for tokens
const tokens = await apphub.oauth.exchangeCode(
  code,
  codeVerifier,
  'https://myapp.com/callback'
)

// tokens contains: access_token, refresh_token, id_token, expires_in

// Refresh tokens when needed
const newTokens = await apphub.oauth.refreshToken(tokens.refresh_token)

// Introspect token to check validity and get metadata
const introspection = await apphub.oauth.introspectToken(tokens.access_token)
if (introspection.active) {
  console.log('Token is valid, expires at:', introspection.exp)
}

// Revoke token when user logs out
await apphub.oauth.revokeToken(tokens.refresh_token, 'refresh_token')
```

### OIDC Discovery

```typescript
// Get OIDC configuration (auto-discovered on first call)
const config = await apphub.oauth.getConfiguration()

console.log('Issuer:', config.issuer)
console.log('Supported scopes:', config.scopes_supported)
console.log('JWKS URI:', config.jwks_uri)
```

### Permission Checking

```typescript
import { hasPermission, requirePermission, canRead } from '@apphub/sdk'

// Simple check
if (hasPermission(ctx, 'vehicles:read')) {
  // User can view vehicles
}

// Guard that throws if missing
requirePermission(ctx, 'vehicles:write')

// Resource-action helpers
if (canRead(ctx, 'vehicles')) { /* ... */ }
if (canWrite(ctx, 'drivers')) { /* ... */ }
```

### Scope Filtering (Multi-Tenancy)

```typescript
import { applyScopeFilter, createScopeFilter } from '@apphub/sdk'

// Configure once
const scopeConfig = {
  entityId: 'entityId',     // Entity field in your DB
  customer: 'customerId',   // Field for customer scope
  region: 'region',         // Field for region scope
}

// Apply to queries
async function getVehicles(ctx: TenantContext) {
  const where = applyScopeFilter({}, ctx, scopeConfig)
  // where = { entityId: 'xxx', customerId: 'yyy' }
  
  return prisma.vehicle.findMany({ where })
}
```

## Next.js Integration

### NextAuth.js Setup

```typescript
// auth.ts
import NextAuth from 'next-auth'
import { createAppHubProvider, createAppHubCallbacks } from '@apphub/sdk/nextjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    createAppHubProvider({
      hubUrl: process.env.APPHUB_URL!,
      clientId: process.env.APPHUB_CLIENT_ID!,
      clientSecret: process.env.APPHUB_CLIENT_SECRET!,
      appSlug: 'myapp',
    }),
  ],
  callbacks: createAppHubCallbacks('myapp'),
})
```

### Protected API Routes

```typescript
// app/api/vehicles/route.ts
import { createPermissionHandler } from '@apphub/sdk/nextjs'

const config = {
  hubUrl: process.env.APPHUB_URL!,
  clientId: process.env.APPHUB_CLIENT_ID!,
  clientSecret: process.env.APPHUB_CLIENT_SECRET!,
  appSlug: 'myapp',
}

export const GET = createPermissionHandler(
  config,
  'vehicles:read',
  async (ctx, request) => {
    // ctx.user, ctx.entity, ctx.permissions are available
    const vehicles = await getVehicles(ctx)
    return Response.json({ data: vehicles })
  }
)
```

### Server Components

```typescript
// app/dashboard/page.tsx
import { auth } from '@/auth'
import { getTenantContextFromSession, hasPermission } from '@apphub/sdk/nextjs'

export default async function DashboardPage() {
  const session = await auth()
  const ctx = getTenantContextFromSession(session)
  
  if (!ctx) {
    redirect('/login')
  }

  return (
    <div>
      <h1>Welcome, {ctx.user.name}</h1>
      <p>Organization: {ctx.entity.name}</p>
      
      {hasPermission(ctx, 'reports:read') && (
        <ReportsWidget />
      )}
    </div>
  )
}
```

## React Client Utilities

```typescript
import { 
  hasPermission, 
  hasRole, 
  canRead,
  filterNavItems,
  getUserDisplayName 
} from '@apphub/sdk/react'

function Navigation({ session }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', href: '/' },
    { id: 'vehicles', label: 'Vehicles', href: '/vehicles', permission: 'vehicles:read' },
    { id: 'settings', label: 'Settings', href: '/settings', role: 'admin' },
  ]

  const visibleItems = filterNavItems(navItems, session)
  
  return (
    <nav>
      {visibleItems.map(item => (
        <Link key={item.id} href={item.href}>{item.label}</Link>
      ))}
    </nav>
  )
}
```

## Webhook Handling

```typescript
// app/api/webhooks/apphub/route.ts
import { createNextJSWebhookHandler } from '@apphub/sdk/nextjs'

export const POST = createNextJSWebhookHandler({
  secret: process.env.APPHUB_WEBHOOK_SECRET!,
  handlers: {
    'user.created': async (event) => {
      console.log('New user:', event.data.email)
      // Sync user to your database
    },
    'membership.updated': async (event) => {
      console.log('Permissions changed:', event.data.newPermissions)
      // Update cached permissions
    },
    'license.suspended': async (event) => {
      console.log('License suspended for entity:', event.entity.id)
      // Disable access for entity
    },
  },
  onError: (error) => {
    console.error('Webhook error:', error)
  },
})
```

## Registering Permissions

```typescript
import { defineCrudPermissions } from '@apphub/sdk'

// Define your app's permissions
const permissions = [
  ...defineCrudPermissions('vehicles', 'Vehicles', {
    groupName: 'Fleet Management',
    defaultActions: ['read'],
    includeExport: true,
  }),
  ...defineCrudPermissions('drivers', 'Drivers', {
    groupName: 'Fleet Management',
    defaultActions: ['read'],
  }),
]

// Register with AppHub on startup
await apphub.api.syncPermissions(permissions)
```

## Scope Types

```typescript
import { 
  defineFullAccessScope, 
  defineCustomerScope, 
  defineRegionScope 
} from '@apphub/sdk'

const scopeTypes = [
  defineFullAccessScope(),
  defineCustomerScope({ 
    multiSelect: false,
    optionsEndpoint: '/api/scope-options/customers'
  }),
  defineRegionScope(),
]

await apphub.api.syncScopeTypes(scopeTypes)
```

## API Reference

### Core Classes

| Class | Description |
|-------|-------------|
| `AppHubOAuth` | OAuth 2.0 / OIDC client with PKCE, discovery, and introspection |
| `AppHubJWT` | JWT token validation and context extraction |
| `AppHubApiClient` | API client for AppHub endpoints |
| `WebhookProcessor` | Webhook event handling |

### Permission Functions

| Function | Description |
|----------|-------------|
| `hasPermission(ctx, permission)` | Check single permission |
| `hasAllPermissions(ctx, permissions)` | Check all permissions required |
| `hasAnyPermission(ctx, permissions)` | Check if any permission granted |
| `hasRole(ctx, role)` | Check minimum role level |
| `requirePermission(ctx, permission)` | Throw if permission missing |
| `canRead/Write/Delete(ctx, resource)` | Resource-action helpers |

### Scope Functions

| Function | Description |
|----------|-------------|
| `applyScopeFilter(where, ctx, config)` | Apply scope to query |
| `hasAccessToRecord(record, ctx, config)` | Check access to single record |
| `filterRecordsByScope(records, ctx, config)` | Filter array by scope |
| `hasFullAccess(ctx)` | Check if no scope restrictions |

## Environment Variables

```env
# Required
APPHUB_URL=https://hub.example.com
APPHUB_CLIENT_ID=myapp_client_xxx
APPHUB_CLIENT_SECRET=secret_xxx

# Optional
APPHUB_WEBHOOK_SECRET=whsec_xxx
APPHUB_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----..."
```

## TypeScript Types

The SDK is fully typed. Key types include:

```typescript
import type {
  AppHubConfig,
  TenantContext,
  Permission,
  EntityRole,
  ScopeValue,
  WebhookEvent,
  AppHubTokenPayload,
  OIDCConfiguration,
  TokenIntrospectionResponse,
  AuthorizationParams,
  TokenResponse,
} from '@apphub/sdk'
```

## Error Handling

```typescript
import { 
  AppHubOAuthError, 
  AppHubJWTError, 
  AppHubApiError,
  AuthorizationError,
  ScopeAccessError,
  WebhookError,
} from '@apphub/sdk'

try {
  const ctx = await apphub.jwt.getTenantContext(token)
} catch (error) {
  if (error instanceof AppHubJWTError) {
    // Token validation failed
    console.error('JWT Error:', error.code, error.message)
  }
}
```

## License

MIT

