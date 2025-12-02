# Entity Details - Tab-Based Design

> **Version:** 2.0  
> **Date:** December 2025  
> **Status:** Design Specification  
> **Purpose:** Simplify entity management by consolidating Settings, Members, and Invitations into a single Entity Details page with tabs

---

## 1. Problem Statement

### Current State (Cluttered Menu)
```
┌─────────────────────────────────────┐
│ Entity Management          [Admin]  │
│   ├─ All Entities      [SysAdmin]  │
│   ├─ Entity Settings    ← Clutter  │
│   ├─ Members            ← Clutter  │
│   ├─ Invitations        ← Clutter  │
│   └─ Sub-Entities                   │
└─────────────────────────────────────┘
```

**Issues:**
- 4-5 menu items for entity management creates visual clutter
- Related functions (settings, members, invites) scattered across menu
- Inconsistent with common SaaS patterns

### Proposed State (Clean Menu + Tabs)
```
┌─────────────────────────────────────┐
│ Entity Management          [Admin]  │
│   ├─ All Entities      [SysAdmin]  │
│   ├─ Current Entity    ← Single    │
│   └─ Sub-Entities      [Tree]      │
└─────────────────────────────────────┘

Entity Details Page:
┌─────────────────────────────────────────────────────┐
│  🏢 Acme Corp                           [Admin ▼]  │
├─────────────────────────────────────────────────────┤
│  [Overview] [Settings] [Members] [Invitations]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Tab Content Area                                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 2. Menu Simplification

### 2.1 Updated Navigation Structure

```typescript
// src/config/dashboard.ts

export const dashboardConfig = {
  navMain: [
    { title: 'Overview', url: '/', icon: LayoutDashboard },
    { title: 'Users', url: '/users', icon: Users },
    { title: 'Settings', url: '/settings', icon: Settings },
  ],

  // Simplified Entity Management
  entityManagement: {
    label: 'Entity Management',
    icon: Building2,
    requiredRoles: ['owner', 'admin', 'manager'],
    items: [
      {
        title: 'All Entities',
        url: '/entities',
        icon: Network,
        requiresSystemAdmin: true,
      },
      {
        title: 'Current Entity',  // ← Single entry point
        url: '/entity',
        icon: Building2,
        requiredRoles: ['owner', 'admin'],
      },
      {
        title: 'Sub-Entities',
        url: '/entity/sub-entities',
        icon: FolderTree,
        requiredRoles: ['owner', 'admin', 'manager'],
      },
    ],
  },

  systemAdmin: { /* unchanged */ },
}
```

### 2.2 Visual Comparison

**Before (5 items):**
```
Entity Management
  ├─ All Entities
  ├─ Entity Settings    ─┐
  ├─ Members            ─┼─ Consolidated into tabs
  ├─ Invitations        ─┘
  └─ Sub-Entities
```

**After (3 items):**
```
Entity Management
  ├─ All Entities        [System Admin]
  ├─ Current Entity      → Opens tab view
  └─ Sub-Entities        [Tree navigation]
```

---

## 3. Entity Details Page Design

### 3.1 Page Structure

```
/entity
├── page.tsx           # Main entity details with tabs
├── loading.tsx        # Loading skeleton
└── layout.tsx         # Optional shared layout

Tabs (within page):
- Overview     → Default tab, entity stats/info
- Settings     → Entity configuration (owner/admin)
- Members      → Member management (owner/admin)  
- Invitations  → Pending invites (owner/admin)
```

### 3.2 Tab Configuration

```typescript
// Tab definitions with role-based visibility
export const ENTITY_TABS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    requiredRoles: ['owner', 'admin', 'manager', 'member'], // All roles
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    requiredRoles: ['owner', 'admin'], // Admin+ only
  },
  {
    id: 'members',
    label: 'Members',
    icon: Users,
    requiredRoles: ['owner', 'admin'], // Admin+ only
    badge: (entity) => entity._count?.memberships, // Dynamic badge
  },
  {
    id: 'invitations',
    label: 'Invitations',
    icon: UserPlus,
    requiredRoles: ['owner', 'admin'], // Admin+ only
    badge: (entity) => entity.pendingInvitesCount, // Show pending count
  },
] as const

export type EntityTabId = typeof ENTITY_TABS[number]['id']
```

### 3.3 URL Pattern Options

**Option A: Query Parameter (Recommended)**
```
/entity              → Overview tab (default)
/entity?tab=settings → Settings tab
/entity?tab=members  → Members tab
/entity?tab=invitations → Invitations tab
```
- ✅ Single page component
- ✅ Easy tab state management
- ✅ Clean URL structure
- ✅ Shareable links

**Option B: Nested Routes**
```
/entity              → Redirect to /entity/overview
/entity/overview     → Overview tab
/entity/settings     → Settings tab
/entity/members      → Members tab
/entity/invitations  → Invitations tab
```
- ⚠️ More complex routing
- ✅ Better for SEO if needed
- ✅ Can have separate loading states

**Recommendation: Option A (Query Parameters)** for simplicity

---

## 4. Component Design

### 4.1 Tabs Component (using Radix UI)

```tsx
// First, install the Tabs component
// npx shadcn@latest add tabs

// src/components/ui/tabs.tsx (generated by shadcn)
```

### 4.2 EntityDetailsTabs Component

```tsx
// src/components/entities/entity-details-tabs.tsx

'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  UserPlus 
} from 'lucide-react'
import type { Entity } from '@prisma/client'

interface EntityDetailsTabsProps {
  entity: Entity & {
    _count: {
      memberships: number
      children: number
    }
    pendingInvitesCount?: number
  }
  membershipRole: string
  isSystemAdmin: boolean
  children: {
    overview: React.ReactNode
    settings: React.ReactNode
    members: React.ReactNode
    invitations: React.ReactNode
  }
}

export function EntityDetailsTabs({
  entity,
  membershipRole,
  isSystemAdmin,
  children,
}: EntityDetailsTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'overview'

  const canManage = isSystemAdmin || ['owner', 'admin'].includes(membershipRole)

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams)
    if (tab === 'overview') {
      params.delete('tab')
    } else {
      params.set('tab', tab)
    }
    router.push(`/entity?${params.toString()}`)
  }

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full max-w-xl grid-cols-4 mb-6">
        {/* Overview - visible to all */}
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <LayoutDashboard className="h-4 w-4" />
          <span className="hidden sm:inline">Overview</span>
        </TabsTrigger>

        {/* Settings - admin only */}
        {canManage && (
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        )}

        {/* Members - admin only */}
        {canManage && (
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Members</span>
            {entity._count.memberships > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {entity._count.memberships}
              </Badge>
            )}
          </TabsTrigger>
        )}

        {/* Invitations - admin only */}
        {canManage && (
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Invitations</span>
            {entity.pendingInvitesCount && entity.pendingInvitesCount > 0 && (
              <Badge variant="default" className="ml-1 h-5 px-1.5">
                {entity.pendingInvitesCount}
              </Badge>
            )}
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="overview" className="mt-0">
        {children.overview}
      </TabsContent>

      {canManage && (
        <>
          <TabsContent value="settings" className="mt-0">
            {children.settings}
          </TabsContent>
          <TabsContent value="members" className="mt-0">
            {children.members}
          </TabsContent>
          <TabsContent value="invitations" className="mt-0">
            {children.invitations}
          </TabsContent>
        </>
      )}
    </Tabs>
  )
}
```

### 4.3 Tab Content Components

```tsx
// src/components/entities/entity-overview-tab.tsx
export function EntityOverviewTab({ entity, stats }) {
  return (
    <div className="space-y-6">
      {/* Entity Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Entity Information</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Name, Slug, Parent, Created date */}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Members" value={stats.members} />
        <StatCard title="Sub-Entities" value={stats.children} />
        <StatCard title="Created" value={formatDate(entity.createdAt)} />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/entity?tab=settings">
              <Settings className="mr-2 h-4 w-4" />
              Edit Settings
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/entity?tab=members">
              <Users className="mr-2 h-4 w-4" />
              Manage Members
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// src/components/entities/entity-settings-tab.tsx
export function EntitySettingsTab({ entity, canEdit }) {
  // Reuse existing settings content
}

// src/components/entities/entity-members-tab.tsx
export function EntityMembersTab({ entity, members, canManage }) {
  // Reuse existing members content
}

// src/components/entities/entity-invitations-tab.tsx
export function EntityInvitationsTab({ entity, invitations, canManage }) {
  // Reuse existing invitations content
}
```

---

## 5. Page Implementation

### 5.1 Entity Details Page

```tsx
// src/app/(dashboard)/entity/page.tsx

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { isSystemAdminRole, getPermissionsForRole } from '@/lib/authorization'
import { EntityDetailsTabs } from '@/components/entities/entity-details-tabs'
import { EntityOverviewTab } from '@/components/entities/entity-overview-tab'
import { EntitySettingsTab } from '@/components/entities/entity-settings-tab'
import { EntityMembersTab } from '@/components/entities/entity-members-tab'
import { EntityInvitationsTab } from '@/components/entities/entity-invitations-tab'

export default async function EntityPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const cookieStore = await cookies()
  const currentEntityId = cookieStore.get('currentEntityId')?.value

  if (!currentEntityId) {
    return <NoEntitySelected />
  }

  // Fetch entity with all related data
  const entity = await prisma.entity.findUnique({
    where: { id: currentEntityId },
    include: {
      parent: true,
      _count: {
        select: {
          children: true,
          memberships: true,
        },
      },
    },
  })

  if (!entity) {
    return <EntityNotFound />
  }

  // Get membership role
  let membershipRole = 'system_admin'
  const isSystemAdmin = isSystemAdminRole(session.user.role)
  
  if (!isSystemAdmin) {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_entityId: {
          userId: session.user.id,
          entityId: currentEntityId,
        },
      },
    })
    membershipRole = membership?.role || 'member'
  }

  // Get pending invitations count
  const pendingInvitesCount = await prisma.entityInvite.count({
    where: {
      entityId: currentEntityId,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  })

  // Get members for members tab
  const members = await prisma.membership.findMany({
    where: { entityId: currentEntityId },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  })

  // Get invitations for invitations tab
  const invitations = await prisma.entityInvite.findMany({
    where: { entityId: currentEntityId },
    orderBy: { createdAt: 'desc' },
  })

  const permissions = getPermissionsForRole(membershipRole)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{entity.name}</h1>
          <p className="text-muted-foreground">
            {entity.parent ? `Sub-entity of ${entity.parent.name}` : 'Root entity'}
          </p>
        </div>
        <Badge variant="outline">{membershipRole}</Badge>
      </div>

      {/* Tabbed Content */}
      <EntityDetailsTabs
        entity={{ ...entity, pendingInvitesCount }}
        membershipRole={membershipRole}
        isSystemAdmin={isSystemAdmin}
      >
        {{
          overview: (
            <EntityOverviewTab 
              entity={entity} 
              stats={{ 
                members: entity._count.memberships,
                children: entity._count.children 
              }}
            />
          ),
          settings: (
            <EntitySettingsTab 
              entity={entity} 
              canEdit={permissions.canManageEntity}
            />
          ),
          members: (
            <EntityMembersTab 
              entity={entity} 
              members={members}
              canManage={permissions.canManageMembers}
            />
          ),
          invitations: (
            <EntityInvitationsTab 
              entity={entity}
              invitations={invitations}
              canManage={permissions.canInviteMembers}
            />
          ),
        }}
      </EntityDetailsTabs>
    </div>
  )
}
```

---

## 6. Visual Mockups

### 6.1 Entity Details - Overview Tab

```
┌─────────────────────────────────────────────────────────────────┐
│  🏢 Acme Corp                                    [Admin ▾]     │
│  Sub-entity of Parent Corp                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [ Overview ]  [ Settings ]  [ Members (8) ]  [ Invites (2) ]  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Entity Information                                       │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ Name:       Acme Corp                                   │   │
│  │ Slug:       acme-corp                                   │   │
│  │ Type:       Sub-Entity                                  │   │
│  │ Created:    Dec 1, 2025                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Members    │  │ Sub-Entities│  │   Created   │            │
│  │     8       │  │      3      │  │ Dec 1, 2025 │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Quick Actions                                           │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ [⚙️ Edit Settings]  [👥 Manage Members]  [📁 Sub-Ent.] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Entity Details - Settings Tab

```
┌─────────────────────────────────────────────────────────────────┐
│  🏢 Acme Corp                                    [Admin ▾]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [ Overview ]  [*Settings*]  [ Members (8) ]  [ Invites (2) ]  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐  │
│  │ General Information │  │ Statistics                       │  │
│  │ ─────────────────── │  │ ───────────────────────────────  │  │
│  │                     │  │                                  │  │
│  │ Name                │  │  ┌────────────┐ ┌────────────┐  │  │
│  │ [Acme Corp        ] │  │  │  Members   │ │ Sub-Ents   │  │  │
│  │                     │  │  │     8      │ │     3      │  │  │
│  │ Slug                │  │  └────────────┘ └────────────┘  │  │
│  │ [acme-corp        ] │  │                                  │  │
│  │                     │  └─────────────────────────────────┘  │
│  │ Parent Entity       │                                       │
│  │ [Parent Corp    ▾]  │                                       │
│  │                     │                                       │
│  │ [Save Changes]      │                                       │
│  └─────────────────────┘                                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Danger Zone                                              │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ [🗑️ Delete Entity]  (Owner only)                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Entity Details - Members Tab

```
┌─────────────────────────────────────────────────────────────────┐
│  🏢 Acme Corp                                    [Admin ▾]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [ Overview ]  [ Settings ]  [*Members (8)*]  [ Invites (2) ]  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Members                                    [+ Invite Member]   │
│  ───────────────────────────────────────────────────────────   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ User              │ Email              │ Role    │ Actions│  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ 👤 John Doe       │ john@acme.com     │ [owner] │ [···]  │  │
│  │ 👤 Jane Smith     │ jane@acme.com     │ [admin] │ [···]  │  │
│  │ 👤 Bob Johnson    │ bob@acme.com      │ [manager]│ [···] │  │
│  │ 👤 Alice Brown    │ alice@acme.com    │ [member]│ [···]  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Role Permissions                                         │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ [owner]  Full control, can delete entity                │   │
│  │ [admin]  Manage settings, members, sub-entities         │   │
│  │ [manager] View & edit sub-entities only                 │   │
│  │ [member] Basic view access                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 Updated Sidebar (Simplified)

```
┌─────────────────────────────────────┐
│ ▾ Acme Corp                         │
│   [≡ Switcher]                      │
│                                     │
│ ─────────────────────────────────── │
│                                     │
│ PLATFORM                            │
│  📊 Overview                        │
│  👥 Users                           │
│  ⚙️ Settings                        │
│                                     │
│ ─────────────────────────────────── │
│                                     │
│ ENTITY MANAGEMENT                   │
│  🏢 All Entities    [SysAdmin]     │
│  🏢 Current Entity  ← Tabs inside  │
│  📁 Sub-Entities                    │
│     ├─ Sales Division               │
│     ├─ Operations                   │
│     └─ + Create                     │
│                                     │
│ ─────────────────────────────────── │
│ [Company Logo]                      │
└─────────────────────────────────────┘
```

---

## 7. Role-Based Tab Visibility

### 7.1 Tab Access Matrix

| Tab | System Admin | Owner | Admin | Manager | Member |
|-----|--------------|-------|-------|---------|--------|
| Overview | ✅ | ✅ | ✅ | ✅ | ✅ |
| Settings | ✅ | ✅ | ✅ | ❌ | ❌ |
| Members | ✅ | ✅ | ✅ | ❌ | ❌ |
| Invitations | ✅ | ✅ | ✅ | ❌ | ❌ |

### 7.2 Manager View

Managers only see the Overview tab when viewing the parent entity:

```
┌─────────────────────────────────────────────────────────────────┐
│  🏢 Acme Corp                                   [Manager ▾]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [ Overview ]                                                   │
│  ↑ Only tab visible to managers                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ℹ️ Manager Access                                        │   │
│  │ You have manager access to this entity's sub-entities.  │   │
│  │ Contact an admin for additional permissions.            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [View Sub-Entities →]                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Implementation Plan

### Phase 1: UI Component Setup
1. Add shadcn/ui Tabs component: `npx shadcn@latest add tabs`
2. Create `EntityDetailsTabs` wrapper component
3. Create tab content components (overview, settings, members, invitations)

### Phase 2: Update Navigation
1. Update `dashboardConfig` to remove individual entity menu items
2. Add single "Current Entity" menu item
3. Update `AppSidebar` to use simplified navigation

### Phase 3: Refactor Pages
1. Create unified `/entity/page.tsx` with tabs
2. Move existing page content into tab components
3. Implement URL query parameter handling for tabs
4. Remove old `/entity/settings`, `/entity/members`, `/entity/invitations` pages

### Phase 4: Polish
1. Add tab transition animations
2. Implement tab-specific loading states
3. Add keyboard navigation (arrow keys between tabs)
4. Mobile-responsive tab design

---

## 9. Files to Modify/Create

### New Files
```
src/components/ui/tabs.tsx              # shadcn tabs component
src/components/entities/entity-details-tabs.tsx
src/components/entities/entity-overview-tab.tsx
src/components/entities/entity-settings-tab.tsx
src/components/entities/entity-members-tab.tsx
src/components/entities/entity-invitations-tab.tsx
```

### Modified Files
```
src/config/dashboard.ts                 # Simplify entity management items
src/components/dashboard/app-sidebar.tsx # Update navigation rendering
src/app/(dashboard)/entity/page.tsx     # New unified page with tabs
```

### Files to Remove (or redirect)
```
src/app/(dashboard)/entity/settings/page.tsx    → Tab in /entity
src/app/(dashboard)/entity/members/page.tsx     → Tab in /entity  
src/app/(dashboard)/entity/invitations/page.tsx → Tab in /entity
```

---

## 10. Migration Strategy

1. **Keep old routes temporarily** with redirects to new tab URLs:
   - `/entity/settings` → `/entity?tab=settings`
   - `/entity/members` → `/entity?tab=members`
   - `/entity/invitations` → `/entity?tab=invitations`

2. **Update all internal links** to use new tab URLs

3. **Remove old pages** after confirming no broken links

---

*Document created: December 2025*  
*Design for: Entity Details Tab-Based UI*

