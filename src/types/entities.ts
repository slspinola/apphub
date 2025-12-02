import type { Entity, Membership } from '@prisma/client'

/**
 * Entity node in the navigation tree
 * Used for hierarchical display in sidebar
 */
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

/**
 * Entity with full hierarchy loaded
 */
export interface EntityWithChildren extends Entity {
    children: EntityWithChildren[]
    parent?: Entity | null
    memberships?: Membership[]
}

/**
 * Entity with user's role attached
 */
export interface EntityWithRole extends Entity {
    role: string
    parent?: Entity | null
    children?: Entity[]
}

/**
 * Context for entity management features
 */
export interface EntityManagementContext {
    currentEntity: EntityNode | null
    entityTree: EntityNode[]
    isSystemAdmin: boolean
    canManage: boolean
    canCreateSubEntities: boolean
}

/**
 * Navigation item for entity management
 */
export interface EntityNavItem {
    title: string
    url: string
    icon: React.ComponentType<{ className?: string }>
    badge?: string | number
    requiredRoles?: string[]
    requiresSystemAdmin?: boolean
}

/**
 * Entity management navigation section
 */
export interface EntityNavSection {
    label: string
    icon: React.ComponentType<{ className?: string }>
    requiredRoles: string[]
    items: EntityNavItem[]
}

/**
 * Entity roles for membership
 * 
 * Role hierarchy (highest to lowest):
 * - owner: Full control of entity, members, and all sub-entities
 * - admin: Manage entity settings, members, and sub-entities
 * - manager: View/edit sub-entities only (no parent entity management)
 * - member: Basic access, view only
 */
export const ENTITY_ROLES = {
    OWNER: 'owner',
    ADMIN: 'admin',
    MANAGER: 'manager',
    MEMBER: 'member',
} as const

export type EntityRole = typeof ENTITY_ROLES[keyof typeof ENTITY_ROLES]

/**
 * Roles that can fully manage the entity (settings, members, sub-entities)
 */
export const ENTITY_ADMIN_ROLES = ['owner', 'admin'] as const
export type EntityAdminRole = typeof ENTITY_ADMIN_ROLES[number]

/**
 * Roles that can view/edit sub-entities (includes admins + manager)
 */
export const SUB_ENTITY_MANAGEMENT_ROLES = ['owner', 'admin', 'manager'] as const
export type SubEntityManagementRole = typeof SUB_ENTITY_MANAGEMENT_ROLES[number]

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
        canManageSubEntities: false,
        canViewSubEntities: true,
        canEditSubEntities: true,
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

export type RolePermissions = typeof ROLE_PERMISSIONS[EntityRole]

