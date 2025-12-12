# AppHub Implementation Workflow

## Executive Summary

This document provides a structured implementation plan for the **AppHub** feature - the apps registry module that manages all ecosystem applications. This feature is **Phase 8** of the main implementation plan but requires foundational elements from **Phase 5 (RBAC)** and **Phase 6 (Licensing)**.

---

## Current State Analysis

### ✅ Implemented Features

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Foundation (Next.js, Prisma, Supabase) | ✅ Complete |
| 2 | Authentication (NextAuth.js, login/register) | ✅ Complete |
| 3 | Multi-tenancy (Entity model, Membership) | ✅ Complete |
| 4 | User Management (basic) | ⚠️ Partial |

### ❌ Missing Features (Required for AppHub)

| Phase | Feature | Priority |
|-------|---------|----------|
| 5 | RBAC (Roles, Permissions) | 🔴 High |
| 6 | Licensing (Plans, Licenses) | 🔴 High |
| 8 | AppHub (Apps Registry) | 🔴 High |
| 7 | OAuth Provider | 🟡 Medium |
| 9 | SDK | 🟢 Low |

---

## Implementation Phases

### Phase 5A: Foundation Models (Prerequisites)

**Objective:** Add base models needed by AppHub

#### 5A.1 Prisma Schema Extensions

```prisma
// ============================================================================
// APP - Ecosystem Application
// ============================================================================

model App {
  id          String    @id @default(cuid())
  
  // Identification
  slug        String    @unique   // "bee2fleet", "bee2vision"
  name        String              // "Bee2Fleet"
  description String?             
  
  // Visual
  icon        String?             
  color       String?             // Primary color (#hex)
  
  // URLs
  baseUrl     String              // "https://fleet.bee2.com"
  loginUrl    String?             
  docsUrl     String?             
  supportUrl  String?             
  
  // State
  status      AppStatus @default(DRAFT)
  isCore      Boolean   @default(false)  // true only for apphub
  isPublic    Boolean   @default(true)   // Visible in launcher
  
  // Configuration
  settings    Json      @default("{}")
  metadata    Json      @default("{}")
  
  // Timestamps
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  publishedAt DateTime?
  
  // Relations
  oauthClient   OAuthClient?
  permissions   Permission[]
  scopeTypes    AppScopeType[]
  plans         Plan[]
  licenses      License[]
  webhooks      AppWebhook[]
  
  @@index([status])
}

enum AppStatus {
  DRAFT       // In development, not visible
  BETA        // In testing, limited visibility
  ACTIVE      // Active and available
  SUSPENDED   // Temporarily suspended
  DEPRECATED  // Marked for discontinuation
  ARCHIVED    // Archived, non-functional
}

// ============================================================================
// OAUTH CLIENT - Authentication Credentials
// ============================================================================

model OAuthClient {
  id            String   @id @default(cuid())
  appId         String   @unique
  
  // Credentials
  clientId      String   @unique
  clientSecret  String                     // Hashed
  
  // OAuth Configuration
  redirectUris  String[]
  scopes        String[] @default(["openid", "profile", "email", "organization"])
  grantTypes    String[] @default(["authorization_code", "refresh_token"])
  
  // Security
  tokenLifetime        Int @default(3600)    // Access token (seconds)
  refreshTokenLifetime Int @default(604800)  // Refresh token (7 days)
  
  // Timestamps
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  secretRotatedAt  DateTime?
  
  // Relations
  app App @relation(fields: [appId], references: [id], onDelete: Cascade)
  
  @@index([clientId])
}

// ============================================================================
// PERMISSION - App Permissions
// ============================================================================

model Permission {
  id          String   @id @default(cuid())
  appId       String
  
  // Identification
  slug        String              // "vehicles:read", "vehicles:write"
  name        String              // "View Vehicles"
  description String?             
  
  // Categorization
  resource    String              // "vehicles", "drivers", "trips"
  action      String              // "read", "write", "delete", "manage"
  
  // Grouping and ordering
  group       String?             // Group for UI display
  sortOrder   Int     @default(0)
  
  // Flags
  isSystem    Boolean @default(false)  // System permission (non-editable)
  isDefault   Boolean @default(false)  // Included by default in new roles
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  app   App              @relation(fields: [appId], references: [id], onDelete: Cascade)
  roles RolePermission[]

  @@unique([appId, slug])
  @@index([appId, resource])
}

// ============================================================================
// APP SCOPE TYPE - Access Scope Definitions
// ============================================================================

model AppScopeType {
  id          String   @id @default(cuid())
  appId       String
  
  // Identification
  slug        String              // "customer", "region", "vehicle_group"
  name        String              // "Customer", "Region"
  description String?             
  
  // Configuration
  requiresSelection Boolean @default(true)
  multiSelect       Boolean @default(false)
  optionsEndpoint   String?                  // "/api/v1/scope-options/customers"
  
  // Validation schema for value
  valueSchema Json?               // JSON Schema for scopeValue validation
  
  // Ordering
  sortOrder   Int     @default(0)
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  app App @relation(fields: [appId], references: [id], onDelete: Cascade)

  @@unique([appId, slug])
}

// ============================================================================
// PLAN - Licensing Plans
// ============================================================================

model Plan {
  id          String   @id @default(cuid())
  appId       String
  
  // Identification
  slug        String              // "basic", "professional", "enterprise"
  name        String              // "Basic", "Professional"
  description String?
  
  // Pricing (optional, for display)
  price       Decimal? @db.Decimal(10, 2)
  currency    String?  @default("EUR")
  billingCycle String? // "monthly", "yearly", "one-time"
  
  // Limits and Features
  limits      Json     @default("{}")  // { "maxUsers": 10, "maxVehicles": 50 }
  features    Json     @default("{}")  // { "reports": true, "api": false }
  
  // State
  isActive    Boolean  @default(true)
  isPublic    Boolean  @default(true)
  isTrial     Boolean  @default(false)
  trialDays   Int?
  
  // Ordering
  sortOrder   Int      @default(0)
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  app      App       @relation(fields: [appId], references: [id], onDelete: Cascade)
  licenses License[]

  @@unique([appId, slug])
}

// ============================================================================
// LICENSE - Active Licenses
// ============================================================================

model License {
  id             String        @id @default(cuid())
  entityId       String
  appId          String
  planId         String
  status         LicenseStatus @default(ACTIVE)
  validFrom      DateTime      @default(now())
  validUntil     DateTime?
  trialEndsAt    DateTime?
  cancelledAt    DateTime?
  metadata       Json          @default("{}")
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  entity   Entity   @relation(fields: [entityId], references: [id], onDelete: Cascade)
  app      App      @relation(fields: [appId], references: [id])
  plan     Plan     @relation(fields: [planId], references: [id])

  @@unique([entityId, appId])
  @@index([status])
}

enum LicenseStatus {
  TRIAL
  ACTIVE
  SUSPENDED
  CANCELLED
  EXPIRED
}

// ============================================================================
// APP WEBHOOK - Event Notifications
// ============================================================================

model AppWebhook {
  id          String   @id @default(cuid())
  appId       String
  
  // Configuration
  url         String
  events      String[]            // ["user.created", "license.activated"]
  
  // Security
  secret      String              // For signing payloads
  
  // State
  isActive    Boolean  @default(true)
  
  // Statistics
  lastTriggeredAt DateTime?
  lastStatus      Int?            // Last HTTP status
  failureCount    Int     @default(0)
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  app App @relation(fields: [appId], references: [id], onDelete: Cascade)

  @@index([appId, isActive])
}

// ============================================================================
// MEMBERSHIP SCOPE - User Scopes per App
// ============================================================================

model MembershipScope {
  id           String   @id @default(cuid())
  membershipId String
  appId        String
  
  // Scope type and value
  scopeType    String   // "full_access", "customer", "region", etc.
  scopeValue   Json?    // { "customer_id": "cust_123" } or null for full_access
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  membership   Membership @relation(fields: [membershipId], references: [id], onDelete: Cascade)

  @@unique([membershipId, appId])
}

// ============================================================================
// RBAC MODELS (For Complete Permission System)
// ============================================================================

model Role {
  id             String   @id @default(cuid())
  name           String
  slug           String
  description    String?
  isSystem       Boolean  @default(false)  // System-defined roles
  entityId       String?  // null = global system role
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  entity       Entity?          @relation(fields: [entityId], references: [id])
  permissions  RolePermission[]
  memberships  MembershipRole[]

  @@unique([slug, entityId])
}

model RolePermission {
  roleId       String
  permissionId String

  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
}

model MembershipRole {
  membershipId String
  roleId       String

  membership Membership @relation(fields: [membershipId], references: [id], onDelete: Cascade)
  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([membershipId, roleId])
}
```

#### 5A.2 Update Existing Models

```prisma
// Update Entity model to include licenses
model Entity {
  // ... existing fields ...
  licenses    License[]
  roles       Role[]
}

// Update Membership model to include scopes and roles
model Membership {
  // ... existing fields ...
  scopes      MembershipScope[]
  roles       MembershipRole[]
}
```

---

### Phase 8: AppHub Implementation

#### 8.1 File Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── apps/                           # NEW: Apps management
│   │       ├── page.tsx                    # Apps listing
│   │       ├── loading.tsx
│   │       ├── error.tsx
│   │       ├── new/
│   │       │   └── page.tsx                # Create new app
│   │       └── [appId]/
│   │           ├── page.tsx                # App details (with tabs)
│   │           ├── loading.tsx
│   │           └── edit/
│   │               └── page.tsx
│   └── api/
│       └── v1/
│           └── apps/                       # NEW: Apps API
│               ├── route.ts                # GET list, POST create
│               └── [appId]/
│                   ├── route.ts            # GET, PATCH, DELETE
│                   ├── oauth/
│                   │   ├── route.ts        # GET, PATCH config
│                   │   └── credentials/
│                   │       └── route.ts    # POST generate/regenerate
│                   ├── permissions/
│                   │   ├── route.ts        # GET, POST
│                   │   ├── sync/
│                   │   │   └── route.ts    # POST sync
│                   │   └── [permissionId]/
│                   │       └── route.ts    # PATCH, DELETE
│                   ├── scope-types/
│                   │   ├── route.ts
│                   │   └── sync/
│                   │       └── route.ts
│                   ├── plans/
│                   │   ├── route.ts
│                   │   └── [planId]/
│                   │       └── route.ts
│                   ├── webhooks/
│                   │   ├── route.ts
│                   │   └── [webhookId]/
│                   │       ├── route.ts
│                   │       └── test/
│                   │           └── route.ts
│                   └── status/
│                       └── route.ts        # POST change status
├── components/
│   └── apps/                               # NEW: Apps components
│       ├── app-card.tsx
│       ├── app-list.tsx
│       ├── app-details-tabs.tsx
│       ├── app-general-tab.tsx
│       ├── app-oauth-tab.tsx
│       ├── app-permissions-tab.tsx
│       ├── app-scope-types-tab.tsx
│       ├── app-plans-tab.tsx
│       ├── app-webhooks-tab.tsx
│       ├── create-app-dialog.tsx
│       ├── create-plan-dialog.tsx
│       ├── create-permission-dialog.tsx
│       ├── create-webhook-dialog.tsx
│       └── app-status-badge.tsx
├── features/
│   └── apps/                               # NEW: Apps server actions
│       ├── actions.ts
│       ├── schemas.ts
│       └── types.ts
├── lib/
│   └── apps/                               # NEW: Apps utilities
│       ├── oauth.ts                        # OAuth credential generation
│       └── webhooks.ts                     # Webhook dispatch
└── types/
    └── apps.ts                             # NEW: Apps types
```

#### 8.2 Implementation Tasks

##### Task 1: Database Schema (Day 1)
- [ ] Add App model to Prisma schema
- [ ] Add OAuthClient model
- [ ] Add Permission model
- [ ] Add AppScopeType model
- [ ] Add Plan model
- [ ] Add License model
- [ ] Add AppWebhook model
- [ ] Add MembershipScope model
- [ ] Add Role model
- [ ] Add RolePermission model
- [ ] Add MembershipRole model
- [ ] Update Entity model (add licenses, roles)
- [ ] Update Membership model (add scopes, roles)
- [ ] Run migration

##### Task 2: Types and Schemas (Day 1)
- [ ] Create `src/types/apps.ts` with TypeScript interfaces
- [ ] Create `src/features/apps/schemas.ts` with Zod validation schemas
- [ ] Create `src/features/apps/types.ts` for internal types

##### Task 3: Server Actions - Core (Day 2)
- [ ] `createApp` - Create new app
- [ ] `getApps` - List apps (with filters)
- [ ] `getAppById` - Get app details
- [ ] `updateApp` - Update app info
- [ ] `deleteApp` - Delete app
- [ ] `changeAppStatus` - Change app status

##### Task 4: Server Actions - OAuth (Day 2)
- [ ] `getOAuthConfig` - Get OAuth configuration
- [ ] `generateCredentials` - Generate client_id/secret
- [ ] `regenerateSecret` - Regenerate client secret
- [ ] `updateOAuthConfig` - Update OAuth settings
- [ ] Create `src/lib/apps/oauth.ts` for credential generation

##### Task 5: Server Actions - Permissions (Day 3)
- [ ] `getAppPermissions` - List permissions
- [ ] `createPermission` - Create permission
- [ ] `updatePermission` - Update permission
- [ ] `deletePermission` - Delete permission
- [ ] `syncPermissions` - Bulk sync permissions

##### Task 6: Server Actions - Scope Types (Day 3)
- [ ] `getAppScopeTypes` - List scope types
- [ ] `createScopeType` - Create scope type
- [ ] `updateScopeType` - Update scope type
- [ ] `deleteScopeType` - Delete scope type
- [ ] `syncScopeTypes` - Bulk sync scope types

##### Task 7: Server Actions - Plans (Day 4)
- [ ] `getAppPlans` - List plans
- [ ] `createPlan` - Create plan
- [ ] `updatePlan` - Update plan
- [ ] `deletePlan` - Delete plan

##### Task 8: Server Actions - Webhooks (Day 4)
- [ ] `getAppWebhooks` - List webhooks
- [ ] `createWebhook` - Create webhook
- [ ] `updateWebhook` - Update webhook
- [ ] `deleteWebhook` - Delete webhook
- [ ] `testWebhook` - Test webhook
- [ ] Create `src/lib/apps/webhooks.ts` for webhook dispatch

##### Task 9: API Routes (Day 5)
- [ ] Create all API route handlers
- [ ] Implement authentication middleware
- [ ] Implement rate limiting
- [ ] Add proper error handling

##### Task 10: UI Components (Day 6-7)
- [ ] `app-card.tsx` - App display card
- [ ] `app-list.tsx` - Apps grid/list
- [ ] `app-details-tabs.tsx` - Tabbed details view
- [ ] `app-general-tab.tsx` - General information
- [ ] `app-oauth-tab.tsx` - OAuth credentials
- [ ] `app-permissions-tab.tsx` - Permissions management
- [ ] `app-scope-types-tab.tsx` - Scope types
- [ ] `app-plans-tab.tsx` - Plans management
- [ ] `app-webhooks-tab.tsx` - Webhooks management
- [ ] `app-status-badge.tsx` - Status indicator
- [ ] `create-app-dialog.tsx` - Create app modal
- [ ] Various form components

##### Task 11: Pages (Day 7-8)
- [ ] `/apps` - Apps listing page
- [ ] `/apps/new` - Create new app page
- [ ] `/apps/[appId]` - App details page (with tabs)
- [ ] `/apps/[appId]/edit` - Edit app page

##### Task 12: Navigation Update (Day 8)
- [ ] Add "Apps" to dashboard navigation
- [ ] Update sidebar configuration
- [ ] Add proper role-based visibility

##### Task 13: Testing (Day 9)
- [ ] Test all server actions
- [ ] Test API routes
- [ ] Test UI components
- [ ] Test permission checks

##### Task 14: Documentation (Day 10)
- [ ] API documentation
- [ ] Usage examples
- [ ] Integration guide

---

## Implementation Order (Recommended)

```
Week 1:
├── Day 1: Schema + Migration + Types
├── Day 2: Core Server Actions + OAuth
├── Day 3: Permissions + Scope Types Actions
├── Day 4: Plans + Webhooks Actions
└── Day 5: API Routes

Week 2:
├── Day 6-7: UI Components
├── Day 7-8: Pages
├── Day 8: Navigation + Integration
├── Day 9: Testing
└── Day 10: Documentation + Polish
```

---

## Dependencies

```
Phase 5A (Foundation Models)
    │
    ▼
Phase 8.1 (Schema)
    │
    ▼
Phase 8.2-8 (Server Actions)
    │
    ▼
Phase 8.9 (API Routes)
    │
    ▼
Phase 8.10-11 (UI)
    │
    ▼
Phase 8.12-14 (Integration & Polish)
```

---

## Key Files to Create

### 1. Prisma Schema Update
**File:** `prisma/schema.prisma`
- Add all new models (App, OAuthClient, Permission, etc.)

### 2. Types
**File:** `src/types/apps.ts`
- AppWithDetails, OAuthConfig, PermissionGroup, etc.

### 3. Validation Schemas
**File:** `src/features/apps/schemas.ts`
- createAppSchema, updateAppSchema, etc.

### 4. Server Actions
**File:** `src/features/apps/actions.ts`
- All CRUD operations for apps and related entities

### 5. OAuth Utilities
**File:** `src/lib/apps/oauth.ts`
- generateClientId, generateClientSecret, hashSecret

### 6. Webhook Utilities
**File:** `src/lib/apps/webhooks.ts`
- dispatchWebhook, signPayload, verifySignature

### 7. Dashboard Config Update
**File:** `src/config/dashboard.ts`
- Add apps management section

---

## Security Considerations

1. **OAuth Secrets**: Hash secrets before storing, show raw only once
2. **Webhook Secrets**: HMAC signing for payload verification
3. **Permissions**: Only super_admin can manage apps
4. **Rate Limiting**: Apply to all API routes
5. **Input Validation**: Zod schemas for all inputs
6. **Redirect URI Validation**: Strict matching for OAuth

---

## Next Steps

1. **Approve this workflow** - Validate approach and priorities
2. **Start with schema** - Add Prisma models
3. **Implement incrementally** - Follow task order
4. **Test continuously** - Verify each component

---

*Document Version: 1.0*
*Created: December 2024*
*Status: Ready for Implementation*

