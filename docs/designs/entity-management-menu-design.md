# Entity Management Menu - System Design

> **Version:** 1.0  
> **Date:** December 2025  
> **Status:** Design Specification

---

## 1. Overview

### 1.1 Purpose
Design a hierarchical navigation menu for managing entities and sub-entities with role-based access control. The system supports:
- **System Admins**: Full access to ALL entities and sub-entities across the platform
- **Organization Admins**: Access to manage their entity and all its sub-entities

### 1.2 Current State
```
┌─────────────────────────────────────┐
│ Entity Switcher (dropdown)          │
├─────────────────────────────────────┤
│ Platform                            │
│   ├─ Overview                       │
│   ├─ Users                          │
│   └─ Settings                       │
└─────────────────────────────────────┘
```

### 1.3 Proposed State
```
┌─────────────────────────────────────┐
│ Entity Switcher (dropdown)          │
├─────────────────────────────────────┤
│ Platform                            │
│   ├─ Overview                       │
│   ├─ Users                          │
│   └─ Settings                       │
├─────────────────────────────────────┤
│ Entity Management          [Admin]  │
│   ├─ All Entities      [SysAdmin]  │
│   ├─ My Entity                      │
│   │   ├─ Settings                   │
│   │   ├─ Members                    │
│   │   └─ Invitations                │
│   └─ Sub-Entities     [Expandable]  │
│       ├─ Sub-Entity A               │
│       │   ├─ Settings               │
│       │   └─ Members                │
│       └─ + Create Sub-Entity        │
└─────────────────────────────────────┘
```

---

## 2. Data Models

### 2.1 Existing Schema (Reference)

```prisma
model Entity {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  logo        String?
  settings    Json     @default("{}")
  parentId    String?
  parent      Entity?  @relation("EntityHierarchy", fields: [parentId], references: [id])
  children    Entity[] @relation("EntityHierarchy")
  memberships Membership[]
}

model Membership {
  id        String @id @default(cuid())
  userId    String
  entityId  String
  role      String @default("member")  // owner | admin | member
  user      User   @relation(...)
  entity    Entity @relation(...)
}
```

### 2.2 Role Hierarchy

| Role | Scope | Permissions |
|------|-------|-------------|
| `system_admin` | Global | All entities, all operations |
| `owner` | Entity + Children | Full control of entity and sub-entities, can delete entity |
| `admin` | Entity + Children | Manage entity settings, members, sub-entities |
| `manager` | Sub-Entities Only | View and edit sub-entities (no parent entity management) |
| `member` | Entity Only | View access, limited actions |

### 2.3 Manager Role Specification

The **manager** role is designed for users who need to oversee sub-entities without having access to the parent entity's settings or member management.

#### Manager Permissions Matrix

| Permission | Owner | Admin | Manager | Member |
|------------|-------|-------|---------|--------|
| View entity dashboard | ✅ | ✅ | ✅ | ✅ |
| Edit entity settings | ✅ | ✅ | ❌ | ❌ |
| Manage entity members | ✅ | ✅ | ❌ | ❌ |
| Invite new members | ✅ | ✅ | ❌ | ❌ |
| **View sub-entities** | ✅ | ✅ | ✅ | ❌ |
| **Edit sub-entity settings** | ✅ | ✅ | ✅ | ❌ |
| **Create sub-entities** | ✅ | ✅ | ❌ | ❌ |
| **Delete sub-entities** | ✅ | ✅ | ❌ | ❌ |
| Delete entity | ✅ | ❌ | ❌ | ❌ |

#### Manager Use Cases

1. **Regional Manager**: Oversees multiple branch offices (sub-entities) but cannot modify HQ settings
2. **Department Supervisor**: Can configure department sub-entities but not organization-level settings
3. **Franchise Coordinator**: Views and edits franchise locations without access to corporate entity

### 2.3 Entity Hierarchy Types

```typescript
type EntityNode = {
  id: string
  name: string
  slug: string
  role: string
  depth: number
  parentId: string | null
  children: EntityNode[]
}

type EntityTree = EntityNode[]
```

---

## 3. Navigation Architecture

### 3.1 Menu Configuration Schema

```typescript
// src/config/dashboard.ts

interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  requiredRoles?: string[]      // Roles that can see this item
  requiresSystemAdmin?: boolean  // Only system_admin can see
  badge?: string | number        // Optional badge (e.g., count)
}

interface NavGroup {
  label: string
  items: NavItem[]
  collapsible?: boolean
  defaultOpen?: boolean
  requiredRoles?: string[]
  requiresSystemAdmin?: boolean
}

interface EntityNavSection {
  type: 'entity-tree'
  label: string
  requiredRoles: string[]  // owner | admin to see entity management
}
```

### 3.2 Updated Dashboard Config

```typescript
// src/config/dashboard.ts
import { 
  LayoutDashboard, 
  Settings, 
  Users,
  Building2,
  Network,
  UserPlus,
  FolderTree,
  Plus,
  Shield,
  Eye
} from 'lucide-react'

export const dashboardConfig = {
  // Main platform navigation
  navMain: [
    {
      title: 'Overview',
      url: '/',
      icon: LayoutDashboard,
    },
    {
      title: 'Users',
      url: '/users',
      icon: Users,
    },
    {
      title: 'Settings',
      url: '/settings',
      icon: Settings,
    },
  ],

  // Entity management section (role-based)
  entityManagement: {
    label: 'Entity Management',
    icon: Building2,
    // Include manager role - they see limited items
    requiredRoles: ['owner', 'admin', 'manager', 'system_admin'],
    items: [
      {
        title: 'All Entities',
        url: '/entities',
        icon: Network,
        requiresSystemAdmin: true,
      },
      {
        title: 'Entity Settings',
        url: '/entity/settings',
        icon: Settings,
        requiredRoles: ['owner', 'admin'], // Manager cannot access
      },
      {
        title: 'Members',
        url: '/entity/members',
        icon: Users,
        requiredRoles: ['owner', 'admin'], // Manager cannot access
      },
      {
        title: 'Invitations',
        url: '/entity/invitations',
        icon: UserPlus,
        requiredRoles: ['owner', 'admin'], // Manager cannot access
      },
      {
        title: 'Sub-Entities',
        url: '/entity/sub-entities',
        icon: FolderTree,
        // Manager can VIEW and EDIT sub-entities
        requiredRoles: ['owner', 'admin', 'manager'],
        // Permission granularity handled at page level
      },
    ],
  },

  // System administration (system_admin only)
  systemAdmin: {
    label: 'System Administration',
    icon: Shield,
    requiresSystemAdmin: true,
    items: [
      {
        title: 'System Settings',
        url: '/settings/system',
        icon: Settings,
      },
      {
        title: 'All Users',
        url: '/admin/users',
        icon: Users,
      },
      {
        title: 'Entity Tree',
        url: '/admin/entities',
        icon: Network,
      },
    ],
  },
}

/**
 * Role-based navigation visibility
 * Determines which nav items each role can see
 */
export const ROLE_NAV_VISIBILITY = {
  system_admin: {
    entityManagement: true,
    allEntities: true,
    entitySettings: true,
    members: true,
    invitations: true,
    subEntities: true,
    systemAdmin: true,
  },
  owner: {
    entityManagement: true,
    allEntities: false,
    entitySettings: true,
    members: true,
    invitations: true,
    subEntities: true,
    systemAdmin: false,
  },
  admin: {
    entityManagement: true,
    allEntities: false,
    entitySettings: true,
    members: true,
    invitations: true,
    subEntities: true,
    systemAdmin: false,
  },
  manager: {
    entityManagement: true,
    allEntities: false,
    entitySettings: false,  // Cannot access
    members: false,         // Cannot access
    invitations: false,     // Cannot access
    subEntities: true,      // Can VIEW and EDIT
    systemAdmin: false,
  },
  member: {
    entityManagement: false, // No management access
    allEntities: false,
    entitySettings: false,
    members: false,
    invitations: false,
    subEntities: false,
    systemAdmin: false,
  },
} as const
```

---

## 4. Component Design

### 4.1 Enhanced App Sidebar

```typescript
// src/components/dashboard/app-sidebar.tsx

interface AppSidebarProps {
  entities: EntityWithRole[]
  currentEntityId?: string
  currentEntity?: EntityWithRole & { children: EntityNode[] }
  userRole: string
  isSystemAdmin: boolean
  companyLogo?: string | null
}

// Render logic:
// 1. Entity Switcher (always visible)
// 2. Platform nav (always visible)
// 3. Entity Management (visible for owner/admin/system_admin)
//    - Dynamically show/hide based on role
// 4. Sub-Entities tree (collapsible, shows hierarchy)
// 5. System Admin section (system_admin only)
```

### 4.2 Entity Tree Component

```typescript
// src/components/entities/entity-tree-nav.tsx

interface EntityTreeNavProps {
  entities: EntityNode[]
  currentEntityId?: string
  depth?: number
  onSelect: (entityId: string) => void
  canCreate: boolean
}

// Features:
// - Recursive rendering for nested entities
// - Collapsible nodes with children
// - Visual indentation (depth * spacing)
// - Active state highlighting
// - Create sub-entity action at each level
// - Badge showing children count
```

### 4.3 Entity Navigation Item

```tsx
// Visual hierarchy with depth indication
<SidebarMenuItem>
  <Collapsible defaultOpen={isActive || hasActiveChild}>
    <CollapsibleTrigger asChild>
      <SidebarMenuButton
        isActive={isCurrentEntity}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {hasChildren && <ChevronRight className="transition-transform" />}
        <Building2 className="h-4 w-4" />
        <span className="truncate">{entity.name}</span>
        {entity.children.length > 0 && (
          <Badge variant="secondary" className="ml-auto">
            {entity.children.length}
          </Badge>
        )}
      </SidebarMenuButton>
    </CollapsibleTrigger>
    
    {hasChildren && (
      <CollapsibleContent>
        <SidebarMenuSub>
          {/* Quick actions for this entity */}
          <SidebarMenuSubItem>
            <SidebarMenuSubButton href={`/entity/${entity.slug}/settings`}>
              <Settings className="h-3 w-3" />
              Settings
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
          
          {/* Recursively render children */}
          {entity.children.map(child => (
            <EntityNavItem 
              key={child.id} 
              entity={child} 
              depth={depth + 1}
            />
          ))}
          
          {/* Create action */}
          {canCreate && (
            <SidebarMenuSubItem>
              <CreateSubEntityButton parentId={entity.id} />
            </SidebarMenuSubItem>
          )}
        </SidebarMenuSub>
      </CollapsibleContent>
    )}
  </Collapsible>
</SidebarMenuItem>
```

---

## 5. Access Control Logic

### 5.1 Permission Utility Functions

```typescript
// src/lib/authorization.ts

export const ENTITY_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  MEMBER: 'member',
} as const

export const ADMIN_ROLES = ['owner', 'admin'] as const
export const SUB_ENTITY_ROLES = ['owner', 'admin', 'manager'] as const

/**
 * Check if user can manage an entity (settings, members)
 * Only owner and admin can manage the entity itself
 */
export function canManageEntity(
  userRole: string, 
  membership?: { role: string }
): boolean {
  if (userRole === 'system_admin') return true
  if (!membership) return false
  return ADMIN_ROLES.includes(membership.role as typeof ADMIN_ROLES[number])
}

/**
 * Check if user can CREATE or DELETE sub-entities
 * Only owner and admin can create/delete
 */
export function canManageSubEntities(
  userRole: string,
  membershipRole?: string
): boolean {
  if (userRole === 'system_admin') return true
  if (!membershipRole) return false
  return ADMIN_ROLES.includes(membershipRole as typeof ADMIN_ROLES[number])
}

/**
 * Check if user can VIEW sub-entities
 * Manager role can view sub-entities
 */
export function canViewSubEntities(
  userRole: string,
  membershipRole?: string
): boolean {
  if (userRole === 'system_admin') return true
  if (!membershipRole) return false
  return SUB_ENTITY_ROLES.includes(membershipRole as typeof SUB_ENTITY_ROLES[number])
}

/**
 * Check if user can EDIT sub-entity settings
 * Manager role can edit sub-entity settings
 */
export function canEditSubEntity(
  userRole: string,
  membershipRole?: string
): boolean {
  if (userRole === 'system_admin') return true
  if (!membershipRole) return false
  return SUB_ENTITY_ROLES.includes(membershipRole as typeof SUB_ENTITY_ROLES[number])
}

/**
 * Get permission object for a user's membership role
 */
export function getPermissionsForRole(membershipRole: string) {
  return {
    canManageEntity: ADMIN_ROLES.includes(membershipRole as any),
    canManageMembers: ADMIN_ROLES.includes(membershipRole as any),
    canViewSubEntities: SUB_ENTITY_ROLES.includes(membershipRole as any),
    canEditSubEntities: SUB_ENTITY_ROLES.includes(membershipRole as any),
    canCreateSubEntities: ADMIN_ROLES.includes(membershipRole as any),
    canDeleteSubEntities: ADMIN_ROLES.includes(membershipRole as any),
    canInviteMembers: ADMIN_ROLES.includes(membershipRole as any),
    canDeleteEntity: membershipRole === 'owner',
  }
}

/**
 * Get accessible entities for user (with hierarchy)
 */
export async function getAccessibleEntityTree(
  userId: string,
  userRole: string
): Promise<EntityNode[]> {
  if (userRole === 'system_admin') {
    // Return full tree
    return getAllEntitiesAsTree()
  }
  
  // Get user's memberships and build tree from their entities
  return getUserEntityTree(userId)
}
```

### 5.2 Server Action for Entity Tree

```typescript
// src/features/entities/actions.ts

export async function getEntityTreeForNav(): Promise<ActionResponse<EntityNode[]>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    if (isSystemAdminRole(session.user.role)) {
      // System admin: get all root entities with children
      const rootEntities = await prisma.entity.findMany({
        where: { parentId: null },
        include: {
          children: {
            include: {
              children: {
                include: { children: true } // 3 levels deep
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      })

      return { 
        success: true, 
        data: buildEntityTree(rootEntities, 'system_admin') 
      }
    }

    // Regular user: get their entities and children
    // Include manager role - they can view sub-entities
    const memberships = await prisma.membership.findMany({
      where: { 
        userId: session.user.id,
        role: { in: ['owner', 'admin', 'manager'] } // Manager can see sub-entities
      },
      include: {
        entity: {
          include: {
            children: {
              include: {
                children: {
                  include: { children: true }
                }
              }
            }
          }
        }
      }
    })

    const trees = memberships.map(m => 
      buildEntityNode(m.entity, m.role, 0)
    )

    return { success: true, data: trees }
  } catch (error) {
    return { success: false, error: 'Failed to fetch entity tree' }
  }
}

function buildEntityNode(
  entity: EntityWithChildren, 
  role: string, 
  depth: number
): EntityNode {
  return {
    id: entity.id,
    name: entity.name,
    slug: entity.slug,
    role,
    depth,
    parentId: entity.parentId,
    children: entity.children?.map(child => 
      buildEntityNode(child, role, depth + 1)
    ) || []
  }
}
```

### 5.3 Manager Role - Sub-Entity Access

The manager role has special handling for sub-entity access:

```typescript
// src/features/entities/actions.ts

/**
 * Check if user can perform action on a sub-entity
 * Manager can view/edit but not create/delete
 */
export async function canAccessSubEntity(
  userId: string,
  subEntityId: string,
  action: 'view' | 'edit' | 'create' | 'delete'
): Promise<boolean> {
  // Get the sub-entity and its parent
  const subEntity = await prisma.entity.findUnique({
    where: { id: subEntityId },
    include: { parent: true }
  })

  if (!subEntity || !subEntity.parentId) {
    return false // Not a sub-entity
  }

  // Check membership on parent entity
  const membership = await prisma.membership.findUnique({
    where: {
      userId_entityId: {
        userId,
        entityId: subEntity.parentId
      }
    }
  })

  if (!membership) return false

  // Permission matrix for manager
  const permissions = getPermissionsForRole(membership.role)

  switch (action) {
    case 'view':
      return permissions.canViewSubEntities
    case 'edit':
      return permissions.canEditSubEntities
    case 'create':
      return permissions.canCreateSubEntities
    case 'delete':
      return permissions.canDeleteSubEntities
    default:
      return false
  }
}

/**
 * Get sub-entities accessible to user based on their role
 * Manager sees all sub-entities but with limited actions
 */
export async function getAccessibleSubEntities(
  userId: string,
  parentEntityId: string
): Promise<{
  entities: Entity[]
  permissions: {
    canView: boolean
    canEdit: boolean
    canCreate: boolean
    canDelete: boolean
  }
}> {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_entityId: {
        userId,
        entityId: parentEntityId
      }
    }
  })

  if (!membership) {
    return { 
      entities: [], 
      permissions: { 
        canView: false, 
        canEdit: false, 
        canCreate: false, 
        canDelete: false 
      } 
    }
  }

  const permissions = getPermissionsForRole(membership.role)

  // Manager can view but with limited actions
  if (!permissions.canViewSubEntities) {
    return { 
      entities: [], 
      permissions: { 
        canView: false, 
        canEdit: false, 
        canCreate: false, 
        canDelete: false 
      } 
    }
  }

  const subEntities = await prisma.entity.findMany({
    where: { parentId: parentEntityId },
    orderBy: { name: 'asc' }
  })

  return {
    entities: subEntities,
    permissions: {
      canView: permissions.canViewSubEntities,
      canEdit: permissions.canEditSubEntities,
      canCreate: permissions.canCreateSubEntities,
      canDelete: permissions.canDeleteSubEntities,
    }
  }
}
```

---

## 6. URL Structure

### 6.1 Route Patterns

| Route | Description | Access |
|-------|-------------|--------|
| `/entities` | All entities list (admin view) | System Admin |
| `/entity/[slug]` | Entity detail/dashboard | Entity Members |
| `/entity/[slug]/settings` | Entity settings | Owner, Admin |
| `/entity/[slug]/members` | Entity members list | Owner, Admin |
| `/entity/[slug]/invitations` | Pending invitations | Owner, Admin |
| `/entity/[slug]/sub-entities` | Sub-entities list | Owner, Admin |
| `/entity/[slug]/sub-entities/new` | Create sub-entity | Owner, Admin |

### 6.2 File Structure

```
src/app/(dashboard)/
├── entities/
│   └── page.tsx              # All entities (System Admin)
├── entity/
│   └── [slug]/
│       ├── page.tsx          # Entity dashboard
│       ├── settings/
│       │   └── page.tsx      # Entity settings
│       ├── members/
│       │   └── page.tsx      # Members management
│       ├── invitations/
│       │   └── page.tsx      # Invitations management
│       └── sub-entities/
│           ├── page.tsx      # Sub-entities list
│           └── new/
│               └── page.tsx  # Create sub-entity
```

---

## 7. UI/UX Specifications

### 7.1 Visual Hierarchy

```
Entity Management Section
│
├─── Section Header: "Entity Management"
│    └── Color: muted-foreground
│
├─── All Entities Link (System Admin only)
│    └── Icon: Network
│    └── Badge: total count
│
├─── Current Entity Section
│    ├── Header: Entity Name (bold)
│    │   └── Indicator: colored dot for entity type
│    ├── Settings
│    ├── Members
│    │   └── Badge: member count
│    └── Invitations
│        └── Badge: pending count (if > 0)
│
└─── Sub-Entities Section (Collapsible)
     ├── Header: "Sub-Entities" + count badge
     ├── Tree View of children
     │   └── Each with expand/collapse
     └── + Create Sub-Entity button
```

### 7.2 State Indicators

| State | Visual Treatment |
|-------|------------------|
| Active entity | Background highlight, bold text |
| Has children | Chevron icon, expandable |
| Pending invitations | Badge with count |
| System Admin viewing | "Admin" badge on section |
| Loading | Skeleton placeholders |

### 7.3 Interactions

1. **Entity Selection**
   - Click entity name → Switch context + navigate to dashboard
   - Chevron click → Expand/collapse only (no navigation)

2. **Quick Actions**
   - Hover reveals action menu (settings, members)
   - Right-click context menu for advanced actions

3. **Create Sub-Entity**
   - Opens modal dialog (existing CreateEntityDialog)
   - Pre-fills parent entity
   - Refreshes tree on success

### 7.4 Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop | Full tree visible, collapsible sections |
| Tablet | Tree visible, auto-collapse deep levels |
| Mobile | Sheet-based sidebar, simplified tree (2 levels max) |
| Collapsed Sidebar | Show only icons, tooltip on hover |

---

## 8. Implementation Plan

### Phase 1: Core Navigation Structure
1. Update `dashboardConfig` with entity management section
2. Create `EntityTreeNav` component
3. Update `AppSidebar` to render entity tree
4. Add permission checks in layout

### Phase 2: Entity Management Pages
1. Create `/entity/[slug]/*` route structure
2. Implement entity settings page
3. Implement members management page
4. Implement invitations management page

### Phase 3: Sub-Entity Management
1. Implement sub-entities list page
2. Update `CreateEntityDialog` for sub-entity creation
3. Add sub-entity quick actions
4. Implement entity deletion (with cascade warning)

### Phase 4: Polish & Optimization
1. Add loading states and skeletons
2. Implement tree virtualization for large hierarchies
3. Add keyboard navigation support
4. Performance optimize re-renders

---

## 9. Component API Reference

### EntityTreeNav

```typescript
interface EntityTreeNavProps {
  /** Array of root-level entity nodes */
  entities: EntityNode[]
  
  /** Currently selected entity ID */
  currentEntityId?: string
  
  /** Callback when entity is selected */
  onSelect?: (entity: EntityNode) => void
  
  /** Whether user can create new entities */
  canCreate?: boolean
  
  /** Maximum depth to render (default: 4) */
  maxDepth?: number
  
  /** Initial expanded entity IDs */
  defaultExpanded?: string[]
}
```

### EntityManagementSection

```typescript
interface EntityManagementSectionProps {
  /** Current user's role */
  userRole: string
  
  /** Current entity context */
  currentEntity?: EntityWithChildren
  
  /** Whether user is system admin */
  isSystemAdmin: boolean
  
  /** Entity tree for navigation */
  entityTree: EntityNode[]
}
```

---

## 10. Security Considerations

### 10.1 Authorization Checks

- **Page Level**: Middleware checks user authentication
- **Component Level**: Role-based rendering (hide unauthorized items)
- **API Level**: Server actions validate permissions before data access
- **Entity Level**: Verify membership + role for each entity operation

### 10.2 Data Exposure

- Never send full entity tree to non-admin users
- Filter children based on user's membership hierarchy
- Sanitize entity names/slugs in URLs

### 10.3 Audit Trail

Consider adding logging for:
- Entity creation/deletion
- Membership changes
- Settings modifications
- Sub-entity hierarchy changes

---

## 11. Future Enhancements

1. **Drag-and-drop** entity reordering
2. **Search** within entity tree
3. **Favorites** for quick access
4. **Recent entities** section
5. **Entity templates** for quick creation
6. **Bulk operations** on multiple entities
7. **Entity archiving** (soft delete)

---

## Appendix A: Type Definitions

```typescript
// src/types/entities.ts

export interface EntityNode {
  id: string
  name: string
  slug: string
  logo?: string | null
  role: string
  depth: number
  parentId: string | null
  children: EntityNode[]
  _count?: {
    children: number
    memberships: number
  }
}

export interface EntityWithChildren extends Entity {
  children: EntityWithChildren[]
  parent?: Entity | null
  memberships?: Membership[]
}

export interface EntityManagementContext {
  currentEntity: EntityNode | null
  entityTree: EntityNode[]
  isSystemAdmin: boolean
  canManage: boolean
  canCreateSubEntities: boolean
  canViewSubEntities: boolean
  canEditSubEntities: boolean
}

/**
 * Entity roles for membership
 */
export const ENTITY_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  MEMBER: 'member',
} as const

export type EntityRole = typeof ENTITY_ROLES[keyof typeof ENTITY_ROLES]

/**
 * Roles that can fully manage the entity
 */
export const ENTITY_ADMIN_ROLES = ['owner', 'admin'] as const

/**
 * Roles that can view/edit sub-entities
 */
export const SUB_ENTITY_MANAGEMENT_ROLES = ['owner', 'admin', 'manager'] as const

/**
 * Permission definitions by role
 */
export const ROLE_PERMISSIONS = {
  owner: {
    canManageEntity: true,
    canManageMembers: true,
    canManageSubEntities: true,
    canViewSubEntities: true,
    canEditSubEntities: true,
    canDeleteEntity: true,
    canInviteMembers: true,
  },
  admin: {
    canManageEntity: true,
    canManageMembers: true,
    canManageSubEntities: true,
    canViewSubEntities: true,
    canEditSubEntities: true,
    canDeleteEntity: false,
    canInviteMembers: true,
  },
  manager: {
    canManageEntity: false,
    canManageMembers: false,
    canManageSubEntities: false,  // Cannot create/delete
    canViewSubEntities: true,      // Can view
    canEditSubEntities: true,      // Can edit settings
    canDeleteEntity: false,
    canInviteMembers: false,
  },
  member: {
    canManageEntity: false,
    canManageMembers: false,
    canManageSubEntities: false,
    canViewSubEntities: false,
    canEditSubEntities: false,
    canDeleteEntity: false,
    canInviteMembers: false,
  },
} as const
```

---

## Appendix B: Visual Mockups

### B.1 System Admin View

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo] AppHub                           [🔔] [👤 User Menu]   │
├─────────────────┬────────────────────────────────────────────┤
│                 │                                            │
│ ▾ Acme Corp    │  Welcome to Acme Corp                      │
│   [≡ Switcher] │                                            │
│                 │  ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│ ─────────────── │  │ Users   │ │ Revenue │ │ Growth  │      │
│                 │  │   124   │ │  $45.2k │ │  +12%   │      │
│ PLATFORM        │  └─────────┘ └─────────┘ └─────────┘      │
│  📊 Overview    │                                            │
│  👥 Users       │                                            │
│  ⚙️ Settings    │                                            │
│                 │                                            │
│ ─────────────── │                                            │
│                 │                                            │
│ ENTITY MGMT     │                                            │
│  🏢 All [12]   │  ← System Admin only                       │
│  ⚙️ Settings    │                                            │
│  👥 Members [8] │                                            │
│  ✉️ Invites [2] │                                            │
│                 │                                            │
│ ▾ Sub-Entities  │                                            │
│   │             │                                            │
│   ├─ 📁 Sales   │                                            │
│   │  ├─ East    │                                            │
│   │  └─ West    │                                            │
│   ├─ 📁 Ops     │                                            │
│   └─ + Create   │                                            │
│                 │                                            │
│ ─────────────── │                                            │
│ [Company Logo]  │                                            │
└─────────────────┴────────────────────────────────────────────┘
```

### B.2 Owner/Admin View

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo] AppHub                           [🔔] [👤 User Menu]   │
├─────────────────┬────────────────────────────────────────────┤
│                 │                                            │
│ ▾ Acme Corp    │  Sub-Entities Management                   │
│   [≡ Switcher] │                                            │
│                 │  ┌────────────────────────────────────┐    │
│ ─────────────── │  │ Sub-Entity        Members  Actions │    │
│                 │  ├────────────────────────────────────┤    │
│ PLATFORM        │  │ 📁 Sales Division    12    [⚙️][🗑️]│    │
│  📊 Overview    │  │ 📁 Operations         8    [⚙️][🗑️]│    │
│  👥 Users       │  │ 📁 Marketing          5    [⚙️][🗑️]│    │
│  ⚙️ Settings    │  └────────────────────────────────────┘    │
│                 │                                            │
│ ─────────────── │  [+ Create Sub-Entity]  ← Admin can create │
│                 │                                            │
│ ENTITY MGMT     │                                            │
│  ⚙️ Settings    │  ← Full access                            │
│  👥 Members [8] │  ← Full access                            │
│  ✉️ Invites [2] │  ← Full access                            │
│                 │                                            │
│ ▾ Sub-Entities  │                                            │
│   ├─ 📁 Sales   │                                            │
│   ├─ 📁 Ops     │                                            │
│   └─ + Create   │  ← Can create                             │
│                 │                                            │
└─────────────────┴────────────────────────────────────────────┘
```

### B.3 Manager View (Limited Access)

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo] AppHub                           [🔔] [👤 User Menu]   │
├─────────────────┬────────────────────────────────────────────┤
│                 │                                            │
│ ▾ Acme Corp    │  Sub-Entities (View & Edit)                │
│   [≡ Switcher] │                                            │
│                 │  ┌────────────────────────────────────┐    │
│ ─────────────── │  │ Sub-Entity        Members  Actions │    │
│                 │  ├────────────────────────────────────┤    │
│ PLATFORM        │  │ 📁 Sales Division    12    [⚙️]    │    │
│  📊 Overview    │  │ 📁 Operations         8    [⚙️]    │    │
│  👥 Users       │  │ 📁 Marketing          5    [⚙️]    │    │
│  ⚙️ Settings    │  └────────────────────────────────────┘    │
│                 │                         ↑                  │
│ ─────────────── │               Edit only, no delete         │
│                 │                                            │
│ ENTITY MGMT     │  ┌─────────────────────────────────────┐   │
│                 │  │ ℹ️ Manager Access                    │   │
│ ▾ Sub-Entities  │  │ You can view and edit sub-entities. │   │
│   ├─ 📁 Sales   │  │ Contact an admin to create or       │   │
│   ├─ 📁 Ops     │  │ delete sub-entities.                │   │
│   └─ 📁 Mktg    │  └─────────────────────────────────────┘   │
│                 │                                            │
│   (No + Create) │  ← Manager cannot create                   │
│                 │                                            │
│ ─────────────── │  Hidden for Manager:                       │
│ [Company Logo]  │  ⚙️ Settings, 👥 Members, ✉️ Invites       │
└─────────────────┴────────────────────────────────────────────┘
```

### B.4 Member View (No Management Access)

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo] AppHub                           [🔔] [👤 User Menu]   │
├─────────────────┬────────────────────────────────────────────┤
│                 │                                            │
│ ▾ Acme Corp    │  Welcome to Acme Corp                      │
│   [≡ Switcher] │                                            │
│                 │  ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│ ─────────────── │  │ Tasks   │ │ Messages│ │ Events  │      │
│                 │  │   12    │ │    3    │ │    5    │      │
│ PLATFORM        │  └─────────┘ └─────────┘ └─────────┘      │
│  📊 Overview    │                                            │
│  👥 Users       │                                            │
│  ⚙️ Settings    │                                            │
│                 │                                            │
│ ─────────────── │  ┌─────────────────────────────────────┐   │
│                 │  │ 👤 Member Access                     │   │
│                 │  │ You have basic access to this       │   │
│                 │  │ entity. Contact an admin for        │   │
│ (No Entity Mgmt │  │ additional permissions.             │   │
│  section shown) │  └─────────────────────────────────────┘   │
│                 │                                            │
│ ─────────────── │                                            │
│ [Company Logo]  │                                            │
└─────────────────┴────────────────────────────────────────────┘
```

---

*Document created: December 2025*  
*Last updated: December 2025*

