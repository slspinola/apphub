# AppHub Application Integration Specification

## Authentication & RBAC Implementation Guide

**Version:** 1.0  
**Date:** December 2024  
**Status:** Specification

---

## 1. Overview

### 1.1 Purpose

This document specifies the requirements for applications to integrate with AppHub's authentication and authorization system. All applications wishing to be part of the AppHub ecosystem must implement these specifications.

### 1.2 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            AppHub (Central Hub)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │    Users     │  │   Entities   │  │    RBAC      │  │  Licensing   │ │
│  │  Management  │  │  Management  │  │   System     │  │   System     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      OAuth 2.0 Provider                           │   │
│  │  • Authorization Code Flow                                        │   │
│  │  • JWT Token Generation                                           │   │
│  │  • Token Refresh                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
             ┌──────────┐    ┌──────────┐    ┌──────────┐
             │   App    │    │   App    │    │   App    │
             │    A     │    │    B     │    │    C     │
             └──────────┘    └──────────┘    └──────────┘
```

### 1.3 Core Concepts

| Concept | Description |
|---------|-------------|
| **Entity** | Hierarchical organizational unit (company, department, team) |
| **User** | Individual with account in the system |
| **Membership** | Relationship between user and entity with assigned role |
| **Role** | User's role within an entity (owner, admin, manager, member) |
| **Scope** | Data access restrictions per application |
| **License** | Entity's subscription to an application with a specific plan |
| **Permission** | Granular action authorization (e.g., `vehicles:read`) |

---

## 2. Registration Requirements

### 2.1 Application Registration

Before integration, applications must be registered in AppHub by a System Administrator. Registration includes:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | string | ✓ | Unique identifier (e.g., `myapp`, `fleet-manager`) |
| `name` | string | ✓ | Display name |
| `description` | string | | Application description |
| `baseUrl` | string | ✓ | Application base URL |
| `loginUrl` | string | | Custom login URL (if different from baseUrl) |
| `docsUrl` | string | | Documentation URL |
| `supportUrl` | string | | Support URL |
| `icon` | string | | Icon URL or emoji |
| `color` | string | | Primary color (hex) |

### 2.2 OAuth Client Configuration

Upon registration, AppHub generates OAuth credentials:

```json
{
  "clientId": "myapp_client_abc123def456",
  "clientSecret": "secret_live_xyz789...",  // Shown ONCE
  "redirectUris": [
    "https://myapp.example.com/api/auth/callback/apphub",
    "http://localhost:3000/api/auth/callback/apphub"
  ],
  "scopes": ["openid", "profile", "email", "organization"],
  "grantTypes": ["authorization_code", "refresh_token"],
  "tokenLifetime": 3600,
  "refreshTokenLifetime": 604800
}
```

> ⚠️ **IMPORTANT**: Store `clientSecret` securely. It is only displayed once during generation.

---

## 3. OAuth 2.0 Authentication Flow

### 3.1 Supported Flows

AppHub implements OAuth 2.0 with the following supported grant types:

| Grant Type | Use Case |
|------------|----------|
| `authorization_code` | Primary flow for user authentication |
| `refresh_token` | Token renewal without re-authentication |

### 3.2 Authorization Code Flow

```
┌────────────┐                              ┌────────────┐                              ┌────────────┐
│   User     │                              │  Your App  │                              │  AppHub    │
└─────┬──────┘                              └─────┬──────┘                              └─────┬──────┘
      │                                           │                                           │
      │  1. Access Protected Resource             │                                           │
      │ ─────────────────────────────────────────►│                                           │
      │                                           │                                           │
      │                                           │  2. Redirect to AppHub                    │
      │◄─────────────────────────────────────────│                                           │
      │                                           │                                           │
      │  3. Authorize (Login + Consent)           │                                           │
      │ ─────────────────────────────────────────────────────────────────────────────────────►│
      │                                           │                                           │
      │                                           │  4. Redirect with Authorization Code      │
      │◄─────────────────────────────────────────────────────────────────────────────────────│
      │                                           │                                           │
      │  5. Follow Redirect                       │                                           │
      │ ─────────────────────────────────────────►│                                           │
      │                                           │                                           │
      │                                           │  6. Exchange Code for Tokens              │
      │                                           │ ─────────────────────────────────────────►│
      │                                           │                                           │
      │                                           │  7. Return Access + Refresh Tokens        │
      │                                           │◄─────────────────────────────────────────│
      │                                           │                                           │
      │  8. Set Session & Return Resource         │                                           │
      │◄─────────────────────────────────────────│                                           │
      │                                           │                                           │
```

### 3.3 Authorization Request

**Step 2: Redirect user to AppHub authorization endpoint**

```
GET https://hub.example.com/oauth/authorize
  ?client_id={clientId}
  &redirect_uri={redirectUri}
  &response_type=code
  &scope=openid profile email organization
  &state={randomState}
  &code_challenge={codeChallenge}
  &code_challenge_method=S256
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `client_id` | ✓ | Your application's client ID |
| `redirect_uri` | ✓ | Must match registered redirect URI exactly |
| `response_type` | ✓ | Must be `code` |
| `scope` | ✓ | Space-separated list of scopes |
| `state` | ✓ | Random string for CSRF protection |
| `code_challenge` | ✓ | PKCE code challenge (SHA256 of verifier, base64url encoded) |
| `code_challenge_method` | ✓ | Must be `S256` |

**Available Scopes:**

| Scope | Description |
|-------|-------------|
| `openid` | Required for OpenID Connect |
| `profile` | User name and profile information |
| `email` | User email address |
| `organization` | Entity/organization information and membership |

### 3.4 Token Exchange

**Step 6: Exchange authorization code for tokens**

```http
POST https://hub.example.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code={authorizationCode}
&redirect_uri={redirectUri}
&client_id={clientId}
&client_secret={clientSecret}
&code_verifier={codeVerifier}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "rt_abc123...",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3.5 Token Refresh

```http
POST https://hub.example.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token={refreshToken}
&client_id={clientId}
&client_secret={clientSecret}
```

---

## 4. JWT Token Structure

### 4.1 Access Token Payload

Applications receive a signed JWT containing:

```json
{
  "iss": "https://hub.example.com",
  "sub": "user_abc123",
  "aud": ["myapp"],
  "exp": 1699999999,
  "iat": 1699996399,
  "jti": "token_xyz789",
  
  "email": "user@example.com",
  "name": "John Doe",
  "image": "https://cdn.example.com/avatars/user.jpg",
  
  "entity_id": "entity_org123",
  "entity_name": "Acme Corp",
  "entity_slug": "acme-corp",
  
  "role": "admin",
  
  "permissions": [
    "vehicles:read",
    "vehicles:write",
    "drivers:read",
    "reports:read"
  ],
  
  "scopes": {
    "myapp": {
      "type": "customer",
      "value": {
        "customer_id": "cust_123",
        "customer_name": "Customer XYZ"
      }
    }
  },
  
  "licensed_apps": ["myapp", "other-app"],
  
  "impersonated_by": null
}
```

### 4.2 Token Claims Reference

| Claim | Type | Description |
|-------|------|-------------|
| `iss` | string | Token issuer (AppHub URL) |
| `sub` | string | User ID (unique identifier) |
| `aud` | string[] | Intended audience (app slugs) |
| `exp` | number | Expiration timestamp |
| `iat` | number | Issued at timestamp |
| `jti` | string | Unique token ID |
| `email` | string | User's email address |
| `name` | string | User's display name |
| `image` | string? | User's avatar URL |
| `entity_id` | string | Current entity/organization ID |
| `entity_name` | string | Entity display name |
| `entity_slug` | string | Entity URL-safe identifier |
| `role` | string | User's role in entity (owner/admin/manager/member) |
| `permissions` | string[] | Granted permissions for this app |
| `scopes` | object | Data access scopes per app |
| `licensed_apps` | string[] | Apps the entity is licensed for |
| `impersonated_by` | object? | Present if user is being impersonated |

### 4.3 Token Validation

Applications MUST validate tokens by:

1. **Verify signature** using AppHub's public key
2. **Check expiration** (`exp` claim)
3. **Verify issuer** (`iss` claim matches AppHub URL)
4. **Verify audience** (`aud` contains your app slug)
5. **Verify license** (your app slug in `licensed_apps`)

**Example validation (TypeScript):**

```typescript
import jwt from 'jsonwebtoken'

interface TokenPayload {
  sub: string
  email: string
  name: string
  entity_id: string
  entity_name: string
  entity_slug: string
  role: string
  permissions: string[]
  scopes: Record<string, ScopeValue>
  licensed_apps: string[]
  impersonated_by?: { id: string; role: string }
}

interface ScopeValue {
  type: string
  value: Record<string, any> | null
}

const APPHUB_PUBLIC_KEY = process.env.APPHUB_PUBLIC_KEY
const APP_SLUG = 'myapp'

export async function validateToken(token: string): Promise<TokenPayload> {
  try {
    const payload = jwt.verify(token, APPHUB_PUBLIC_KEY, {
      algorithms: ['RS256'],
      issuer: process.env.APPHUB_URL,
      audience: APP_SLUG,
    }) as TokenPayload

    // Verify app is licensed
    if (!payload.licensed_apps.includes(APP_SLUG)) {
      throw new Error('Application not licensed for this entity')
    }

    return payload
  } catch (error) {
    throw new Error(`Token validation failed: ${error.message}`)
  }
}
```

---

## 5. Role-Based Access Control (RBAC)

### 5.1 Entity Roles Hierarchy

AppHub defines the following role hierarchy within entities:

```
┌─────────────────────────────────────────────────────────────────┐
│                         OWNER                                    │
│  • Full control of entity, members, and all sub-entities        │
│  • Can delete entity                                             │
│  • Can transfer ownership                                        │
├─────────────────────────────────────────────────────────────────┤
│                         ADMIN                                    │
│  • Manage entity settings, members, and sub-entities            │
│  • Cannot delete entity                                          │
├─────────────────────────────────────────────────────────────────┤
│                        MANAGER                                   │
│  • View/edit sub-entities only                                   │
│  • No parent entity management                                   │
├─────────────────────────────────────────────────────────────────┤
│                         MEMBER                                   │
│  • Basic access, view only                                       │
│  • No management permissions                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Role Permissions Matrix

| Permission | Owner | Admin | Manager | Member |
|------------|:-----:|:-----:|:-------:|:------:|
| Manage Entity | ✓ | ✓ | ✗ | ✗ |
| Manage Members | ✓ | ✓ | ✗ | ✗ |
| Manage Sub-Entities | ✓ | ✓ | ✗ | ✗ |
| View Sub-Entities | ✓ | ✓ | ✓ | ✗ |
| Edit Sub-Entities | ✓ | ✓ | ✓ | ✗ |
| Delete Entity | ✓ | ✗ | ✗ | ✗ |
| Invite Members | ✓ | ✓ | ✗ | ✗ |

### 5.3 System Admin

A special `system_admin` role exists at the platform level (not entity level):

- Full access to all entities and resources
- Can manage all users regardless of entity membership
- Can impersonate users (except other system admins)
- Identified by `role: "system_admin"` in user session (not JWT)

### 5.4 Application Permissions

Beyond entity roles, applications define granular permissions:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Permission Structure                          │
├─────────────────────────────────────────────────────────────────┤
│  Format: {resource}:{action}                                     │
│                                                                  │
│  Examples:                                                       │
│  • vehicles:read    - View vehicles                              │
│  • vehicles:write   - Create/edit vehicles                       │
│  • vehicles:delete  - Delete vehicles                            │
│  • drivers:read     - View drivers                               │
│  • reports:export   - Export reports                             │
│  • settings:manage  - Manage app settings                        │
└─────────────────────────────────────────────────────────────────┘
```

### 5.5 Implementing Permission Checks

**TypeScript Example:**

```typescript
interface TenantContext {
  userId: string
  entityId: string
  role: string
  permissions: string[]
  scope: ScopeValue | null
}

// Middleware to extract and validate context
export async function getTenantContext(req: Request): Promise<TenantContext> {
  const token = extractBearerToken(req)
  const payload = await validateToken(token)
  
  return {
    userId: payload.sub,
    entityId: payload.entity_id,
    role: payload.role,
    permissions: payload.permissions,
    scope: payload.scopes['myapp'] || null
  }
}

// Permission check helper
export function hasPermission(ctx: TenantContext, permission: string): boolean {
  return ctx.permissions.includes(permission)
}

// Usage in route handler
export async function GET(req: Request) {
  const ctx = await getTenantContext(req)
  
  if (!hasPermission(ctx, 'vehicles:read')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // Proceed with authorized access...
}
```

### 5.6 Registering Application Permissions

Applications must register their permissions with AppHub:

```http
POST /api/v1/apps/{appId}/permissions/sync
Authorization: Bearer {serviceToken}
Content-Type: application/json

{
  "permissions": [
    {
      "slug": "vehicles:read",
      "name": "View Vehicles",
      "description": "View list of vehicles and details",
      "resource": "vehicles",
      "action": "read",
      "groupName": "Vehicles",
      "isDefault": true
    },
    {
      "slug": "vehicles:write",
      "name": "Edit Vehicles",
      "description": "Create and update vehicles",
      "resource": "vehicles",
      "action": "write",
      "groupName": "Vehicles",
      "isDefault": false
    },
    {
      "slug": "vehicles:delete",
      "name": "Delete Vehicles",
      "description": "Remove vehicles from the system",
      "resource": "vehicles",
      "action": "delete",
      "groupName": "Vehicles",
      "isDefault": false
    }
  ]
}
```

---

## 6. Scope System (Data-Level Access Control)

### 6.1 Overview

The Scope system complements RBAC by restricting access to **data subsets**:

- **RBAC** defines **what** a user can do (actions)
- **Scope** defines **which data** those actions apply to

### 6.2 Scope Structure

```json
{
  "scopes": {
    "myapp": {
      "type": "customer",
      "value": {
        "customer_id": "cust_123",
        "customer_name": "Customer XYZ"
      }
    }
  }
}
```

### 6.3 Scope Types

| Type | Description | Value Structure |
|------|-------------|-----------------|
| `full_access` | Access to all data | `null` |
| `customer` | Limited to single customer | `{ "customer_id": "..." }` |
| `customers` | Limited to multiple customers | `{ "customer_ids": ["...", "..."] }` |
| `region` | Limited to geographic region | `{ "region": "north" }` |
| `entity_ids` | Limited to specific IDs | `{ "ids": ["...", "..."] }` |
| `custom` | App-defined filter | `{ ... }` |

### 6.4 Implementing Scope Filters

**TypeScript Example:**

```typescript
type ScopeFilterConfig = {
  customer?: string      // DB field for customer scope
  customers?: string     // DB field for multiple customers
  region?: string        // DB field for region scope
  entity_ids?: string    // DB field for entity IDs
}

export function applyScopeFilter<T extends Record<string, any>>(
  where: T,
  scope: ScopeValue | null,
  config: ScopeFilterConfig
): T {
  if (!scope || scope.type === 'full_access') {
    return where
  }

  const result = { ...where }

  switch (scope.type) {
    case 'customer':
      if (config.customer && scope.value?.customer_id) {
        result[config.customer] = scope.value.customer_id
      }
      break

    case 'customers':
      if (config.customers && scope.value?.customer_ids) {
        result[config.customers] = { in: scope.value.customer_ids }
      }
      break

    case 'region':
      if (config.region && scope.value?.region) {
        result[config.region] = scope.value.region
      }
      break

    case 'entity_ids':
      if (config.entity_ids && scope.value?.ids) {
        result[config.entity_ids] = { in: scope.value.ids }
      }
      break

    default:
      // Custom scope: apply all fields from value
      if (scope.value) {
        Object.assign(result, scope.value)
      }
  }

  return result
}

// Usage
const SCOPE_CONFIG: ScopeFilterConfig = {
  customer: 'customerId',
  region: 'region'
}

async function getVehicles(ctx: TenantContext) {
  let where: any = {
    entityId: ctx.entityId  // Always filter by entity
  }
  
  // Apply scope restrictions
  where = applyScopeFilter(where, ctx.scope, SCOPE_CONFIG)
  
  return prisma.vehicle.findMany({ where })
}
```

### 6.5 Registering Scope Types

Applications must register supported scope types:

```http
POST /api/v1/apps/{appId}/scope-types/sync
Authorization: Bearer {serviceToken}
Content-Type: application/json

{
  "scopeTypes": [
    {
      "slug": "full_access",
      "name": "Full Access",
      "description": "Access to all organization data",
      "requiresSelection": false
    },
    {
      "slug": "customer",
      "name": "Customer",
      "description": "Limited to a specific customer",
      "requiresSelection": true,
      "optionsEndpoint": "/api/v1/scope-options/customers"
    },
    {
      "slug": "region",
      "name": "Region",
      "description": "Limited to a geographic region",
      "requiresSelection": true,
      "optionsEndpoint": "/api/v1/scope-options/regions"
    }
  ]
}
```

### 6.6 Scope Options Endpoint

Applications must provide an endpoint for scope option selection:

```http
GET /api/v1/scope-options/{scopeType}
Authorization: Bearer {serviceToken}
X-Tenant-ID: {entityId}
```

**Response:**

```json
{
  "data": [
    { "id": "cust_001", "name": "Customer A", "meta": { "city": "New York" } },
    { "id": "cust_002", "name": "Customer B", "meta": { "city": "Boston" } },
    { "id": "cust_003", "name": "Customer C", "meta": { "city": "Chicago" } }
  ]
}
```

---

## 7. API Requirements

### 7.1 Required Endpoints

Applications MUST implement the following endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/callback/apphub` | GET | OAuth callback handler |
| `/api/v1/scope-options/{type}` | GET | Scope options provider (if using scopes) |
| `/api/webhooks/apphub` | POST | Webhook receiver (if subscribed) |

### 7.2 Required Headers

All authenticated API requests from your app to AppHub must include:

```http
Authorization: Bearer {accessToken}
Content-Type: application/json
X-App-ID: {yourAppSlug}
```

### 7.3 Multi-Tenancy Requirements

Applications MUST:

1. **Always filter by entity** - Every query must include `entity_id` filter
2. **Apply scope filters** - Use scope data to further restrict results
3. **Check permissions** - Verify user has required permission before action
4. **Validate licenses** - Confirm entity is licensed for your app

**Example middleware stack:**

```typescript
// 1. Extract and validate token
const ctx = await getTenantContext(req)

// 2. Check entity is licensed
if (!ctx.licensedApps.includes(APP_SLUG)) {
  return Response.json({ error: 'Not licensed' }, { status: 403 })
}

// 3. Check permission
if (!hasPermission(ctx, 'vehicles:read')) {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

// 4. Build query with entity and scope filters
let where = { entityId: ctx.entityId }
where = applyScopeFilter(where, ctx.scope, SCOPE_CONFIG)

// 5. Execute query
const vehicles = await prisma.vehicle.findMany({ where })
```

---

## 8. Webhook Integration

### 8.1 Available Events

Applications can subscribe to these events:

| Event | Description |
|-------|-------------|
| `user.created` | New user created in entity |
| `user.updated` | User data changed |
| `user.deleted` | User removed |
| `user.suspended` | User suspended |
| `user.activated` | User activated |
| `entity.updated` | Entity data changed |
| `entity.settings.updated` | Entity settings changed |
| `membership.created` | User added to entity |
| `membership.updated` | User role/scope changed |
| `membership.deleted` | User removed from entity |
| `license.activated` | License activated |
| `license.updated` | License changed |
| `license.suspended` | License suspended |
| `license.cancelled` | License cancelled |
| `license.expired` | License expired |

### 8.2 Webhook Payload Format

```json
{
  "id": "evt_abc123xyz789",
  "type": "user.created",
  "timestamp": "2024-12-06T14:30:00Z",
  "appId": "myapp",
  
  "entity": {
    "id": "entity_org123",
    "slug": "acme-corp"
  },
  
  "data": {
    "userId": "user_abc123",
    "email": "newuser@example.com",
    "name": "New User",
    "role": "member",
    "permissions": ["vehicles:read"],
    "scope": {
      "type": "customer",
      "value": { "customer_id": "cust_001" }
    }
  },
  
  "actor": {
    "type": "user",
    "id": "user_admin456",
    "email": "admin@example.com"
  }
}
```

### 8.3 Signature Verification

All webhooks are signed with HMAC-SHA256. **You MUST verify signatures:**

```typescript
import crypto from 'crypto'

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(`sha256=${expected}`)
    )
  } catch {
    return false
  }
}

// Webhook handler
export async function POST(req: Request) {
  const payload = await req.text()
  const signature = req.headers.get('X-AppHub-Signature')
  
  if (!signature) {
    return Response.json({ error: 'Missing signature' }, { status: 401 })
  }
  
  if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  const event = JSON.parse(payload)
  
  // Process event based on type
  switch (event.type) {
    case 'user.created':
      await handleUserCreated(event.data)
      break
    case 'membership.updated':
      await handleMembershipUpdated(event.data)
      break
    case 'license.suspended':
      await handleLicenseSuspended(event.entity)
      break
    // ... handle other events
  }
  
  return Response.json({ received: true })
}
```

### 8.4 Webhook Best Practices

1. **Respond quickly** - Return 2xx within 5 seconds, process async
2. **Be idempotent** - Handle duplicate deliveries gracefully
3. **Handle retries** - AppHub retries failed deliveries with exponential backoff
4. **Log events** - Keep audit trail of received webhooks

---

## 9. Security Requirements

### 9.1 Token Security

| Requirement | Description |
|-------------|-------------|
| HTTPS Only | All token transmission must use TLS 1.2+ |
| Secure Storage | Store tokens in secure, encrypted storage |
| No Logging | Never log tokens in application logs |
| Short Lifetime | Access tokens expire in 1 hour by default |

### 9.2 Secret Management

| Requirement | Description |
|-------------|-------------|
| Environment Variables | Store secrets in environment variables, never in code |
| Rotation | Support secret rotation without downtime |
| Access Control | Limit access to secrets to necessary systems only |

### 9.3 PKCE Requirement

**PKCE (Proof Key for Code Exchange) is REQUIRED for all authorization flows:**

```typescript
import crypto from 'crypto'

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url')
}

function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url')
}

// Usage
const verifier = generateCodeVerifier()
const challenge = generateCodeChallenge(verifier)

// Store verifier in session for token exchange
// Include challenge in authorization request
```

### 9.4 Input Validation

All applications MUST:

1. Validate and sanitize all input
2. Use parameterized queries (no raw SQL)
3. Validate token claims match expected values
4. Check entity_id in token matches requested resource

### 9.5 Scope Bypass Prevention

**CRITICAL: Always apply scope filters to prevent data leakage:**

```typescript
// ❌ WRONG: Allows scope bypass
async function getVehicle(id: string) {
  return prisma.vehicle.findUnique({ where: { id } })
}

// ✅ CORRECT: Always applies scope
async function getVehicle(ctx: TenantContext, id: string) {
  let where: any = {
    id,
    entityId: ctx.entityId
  }
  where = applyScopeFilter(where, ctx.scope, SCOPE_CONFIG)
  
  return prisma.vehicle.findFirst({ where })
}
```

---

## 10. Implementation Checklist

### 10.1 Registration

- [ ] Application registered in AppHub
- [ ] OAuth credentials received and securely stored
- [ ] Redirect URIs configured

### 10.2 Authentication

- [ ] OAuth authorization flow implemented
- [ ] Token exchange working
- [ ] Token refresh implemented
- [ ] PKCE implemented
- [ ] Token validation with signature verification
- [ ] License check implemented

### 10.3 RBAC

- [ ] Permission extraction from token
- [ ] Permission checks on all protected routes
- [ ] Role-based UI adjustments (if applicable)
- [ ] Permissions registered with AppHub

### 10.4 Scopes

- [ ] Scope types registered (if needed)
- [ ] Scope options endpoint implemented (if needed)
- [ ] Scope filters applied to all queries
- [ ] Scope-based UI restrictions (if applicable)

### 10.5 Webhooks

- [ ] Webhook endpoint implemented
- [ ] Signature verification working
- [ ] Event handlers for subscribed events
- [ ] Webhook registered in AppHub

### 10.6 Multi-Tenancy

- [ ] All queries filter by entity_id
- [ ] Scope filters applied everywhere
- [ ] No cross-entity data leakage
- [ ] Tested with multiple entities

### 10.7 Security

- [ ] HTTPS everywhere
- [ ] Secrets in environment variables
- [ ] No tokens in logs
- [ ] Input validation on all endpoints
- [ ] Rate limiting implemented

---

## 11. Reference Implementation

### 11.1 Next.js with NextAuth.js

For Next.js applications, we recommend using NextAuth.js with a custom AppHub provider:

```typescript
// auth.config.ts
import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isPublicPath = ['/login', '/register'].some(
        path => nextUrl.pathname.startsWith(path)
      )
      
      if (isPublicPath) return true
      return isLoggedIn
    },
  },
}
```

```typescript
// auth.ts
import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    {
      id: 'apphub',
      name: 'AppHub',
      type: 'oidc',
      issuer: process.env.APPHUB_URL,
      clientId: process.env.APPHUB_CLIENT_ID,
      clientSecret: process.env.APPHUB_CLIENT_SECRET,
      authorization: {
        params: { scope: 'openid profile email organization' }
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.image,
          entityId: profile.entity_id,
          role: profile.role,
          permissions: profile.permissions,
          scopes: profile.scopes,
        }
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.entityId = profile.entity_id
        token.role = profile.role
        token.permissions = profile.permissions
        token.scopes = profile.scopes
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.entityId = token.entityId
        session.user.role = token.role
        session.user.permissions = token.permissions
        session.user.scopes = token.scopes
      }
      return session
    },
  },
})
```

### 11.2 Environment Variables

```env
# AppHub Configuration
APPHUB_URL=https://hub.example.com
APPHUB_CLIENT_ID=myapp_client_abc123
APPHUB_CLIENT_SECRET=secret_live_xyz789...
APPHUB_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# Webhook Configuration
WEBHOOK_SECRET=whsec_abc123...

# App Configuration
APP_SLUG=myapp
APP_URL=https://myapp.example.com
```

---

## 12. Support & Resources

### 12.1 Documentation

- AppHub Developer Portal: `https://hub.example.com/docs`
- API Reference: `https://hub.example.com/docs/api`
- SDK Documentation: `https://hub.example.com/docs/sdk`

### 12.2 Testing

- Sandbox Environment: `https://sandbox.hub.example.com`
- Test Credentials available in developer portal

### 12.3 Support

- Developer Support: `developers@example.com`
- Integration Issues: File issues in the developer portal

---

*This specification is maintained by the AppHub team. For questions or clarifications, contact the integration support team.*

