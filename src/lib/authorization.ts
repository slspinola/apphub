import { auth } from '@/auth'
import {
    ENTITY_ROLES,
    ENTITY_ADMIN_ROLES,
    SUB_ENTITY_MANAGEMENT_ROLES,
    ROLE_PERMISSIONS,
    type EntityRole,
} from '@/types/entities'

/**
 * System Admin role constant
 */
export const SYSTEM_ADMIN_ROLE = 'system_admin'

/**
 * Re-export entity roles for convenience
 */
export { ENTITY_ROLES, ENTITY_ADMIN_ROLES, SUB_ENTITY_MANAGEMENT_ROLES, ROLE_PERMISSIONS }

/**
 * Checks if the current session user is a System Admin
 * System Admins have unrestricted access to all resources in the system
 */
export async function isSystemAdmin(): Promise<boolean> {
    const session = await auth()
    return session?.user?.role === SYSTEM_ADMIN_ROLE
}

/**
 * Checks if a user with given role is a System Admin
 */
export function isSystemAdminRole(role: string | undefined | null): boolean {
    return role === SYSTEM_ADMIN_ROLE
}

/**
 * Returns the current authenticated user with their role
 */
export async function getCurrentUser() {
    const session = await auth()
    if (!session?.user?.id) {
        return null
    }
    return {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        isSystemAdmin: session.user.role === SYSTEM_ADMIN_ROLE,
    }
}

/**
 * Checks if user has permission to perform an action
 * System Admin always has permission
 */
export async function hasPermission(requiredRole: string | string[]): Promise<boolean> {
    const session = await auth()
    if (!session?.user?.role) {
        return false
    }

    // System Admin has all permissions
    if (session.user.role === SYSTEM_ADMIN_ROLE) {
        return true
    }

    // Check if user's role matches any of the required roles
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    return roles.includes(session.user.role)
}

/**
 * Check if user can manage an entity (settings, members)
 * Only owner and admin can manage the entity itself
 */
export function canManageEntity(
    userRole: string | undefined | null,
    membershipRole?: string | null
): boolean {
    if (isSystemAdminRole(userRole)) return true
    if (!membershipRole) return false
    return (ENTITY_ADMIN_ROLES as readonly string[]).includes(membershipRole)
}

/**
 * Check if user can CREATE or DELETE sub-entities
 * Only owner and admin can create/delete
 */
export function canManageSubEntities(
    userRole: string | undefined | null,
    membershipRole?: string | null
): boolean {
    if (isSystemAdminRole(userRole)) return true
    if (!membershipRole) return false
    return (ENTITY_ADMIN_ROLES as readonly string[]).includes(membershipRole)
}

/**
 * Check if user can VIEW sub-entities
 * Manager role can view sub-entities
 */
export function canViewSubEntities(
    userRole: string | undefined | null,
    membershipRole?: string | null
): boolean {
    if (isSystemAdminRole(userRole)) return true
    if (!membershipRole) return false
    return (SUB_ENTITY_MANAGEMENT_ROLES as readonly string[]).includes(membershipRole)
}

/**
 * Check if user can EDIT sub-entity settings
 * Manager role can edit sub-entity settings
 */
export function canEditSubEntity(
    userRole: string | undefined | null,
    membershipRole?: string | null
): boolean {
    if (isSystemAdminRole(userRole)) return true
    if (!membershipRole) return false
    return (SUB_ENTITY_MANAGEMENT_ROLES as readonly string[]).includes(membershipRole)
}

export function canManageMembers(
    membershipRole?: string | null
): boolean {
    if (!membershipRole) return false
    // Assuming owners and admins can manage members
    return (ENTITY_ADMIN_ROLES as readonly string[]).includes(membershipRole)
}

/**
 * Get permission object for a user's membership role
 */
export function getPermissionsForRole(membershipRole: string | undefined | null) {
    if (!membershipRole || !(membershipRole in ROLE_PERMISSIONS)) {
        return {
            canManageEntity: false,
            canManageMembers: false,
            canViewSubEntities: false,
            canEditSubEntities: false,
            canCreateSubEntities: false,
            canDeleteSubEntities: false,
            canInviteMembers: false,
            canDeleteEntity: false,
        }
    }

    const permissions = ROLE_PERMISSIONS[membershipRole as EntityRole]
    return {
        canManageEntity: permissions.canManageEntity,
        canManageMembers: permissions.canManageMembers,
        canViewSubEntities: permissions.canViewSubEntities,
        canEditSubEntities: permissions.canEditSubEntities,
        canCreateSubEntities: permissions.canManageSubEntities,
        canDeleteSubEntities: permissions.canManageSubEntities,
        canInviteMembers: permissions.canInviteMembers,
        canDeleteEntity: permissions.canDeleteEntity,
    }
}

/**
 * Check if a nav item should be visible based on user role and membership
 */
export function shouldShowNavItem(
    item: { requiredRoles?: string[]; requiresSystemAdmin?: boolean },
    userRole: string | undefined | null,
    membershipRole?: string | null
): boolean {
    // System admin sees everything
    if (isSystemAdminRole(userRole)) return true

    // Check if item requires system admin
    if (item.requiresSystemAdmin) return false

    // Check if item has role requirements
    if (item.requiredRoles && item.requiredRoles.length > 0) {
        if (!membershipRole) return false
        return item.requiredRoles.includes(membershipRole)
    }

    // No restrictions, show to all
    return true
}

// ============================================================================
// USER MANAGEMENT PERMISSIONS
// ============================================================================

/**
 * Check if the session user can manage (view/edit/delete) a target user
 * System Admins can manage all users
 * Users can manage themselves
 * Entity admins can manage users in their entities (not implemented yet)
 */
export async function canManageUser(targetUserId: string): Promise<boolean> {
    const session = await auth()
    if (!session?.user?.id) {
        return false
    }

    // System admin can manage all users
    if (session.user.role === SYSTEM_ADMIN_ROLE) {
        return true
    }

    // Users can manage themselves
    if (session.user.id === targetUserId) {
        return true
    }

    // TODO: Check if user is admin in same entity as target user
    return false
}

/**
 * Check if session user can manage a target user (non-async version)
 */
export function canManageUserSync(
    sessionUserId: string,
    sessionUserRole: string | undefined | null,
    targetUserId: string
): boolean {
    // System admin can manage all users
    if (isSystemAdminRole(sessionUserRole)) {
        return true
    }

    // Users can manage themselves
    if (sessionUserId === targetUserId) {
        return true
    }

    return false
}

/**
 * Check if session user can impersonate a target user
 * Only system admins can impersonate
 * Cannot impersonate other system admins
 * Cannot impersonate self
 */
export async function canImpersonateUser(targetUserId: string, targetUserRole?: string): Promise<boolean> {
    const session = await auth()
    if (!session?.user?.id) {
        return false
    }

    // Only system admin can impersonate
    if (session.user.role !== SYSTEM_ADMIN_ROLE) {
        return false
    }

    // Cannot impersonate self
    if (session.user.id === targetUserId) {
        return false
    }

    // Cannot impersonate other system admins
    if (isSystemAdminRole(targetUserRole)) {
        return false
    }

    return true
}

/**
 * Check if session user can impersonate (non-async, with explicit parameters)
 */
export function canImpersonateUserSync(
    sessionUserId: string,
    sessionUserRole: string | undefined | null,
    targetUserId: string,
    targetUserRole: string | undefined | null
): boolean {
    // Only system admin can impersonate
    if (!isSystemAdminRole(sessionUserRole)) {
        return false
    }

    // Cannot impersonate self
    if (sessionUserId === targetUserId) {
        return false
    }

    // Cannot impersonate other system admins
    if (isSystemAdminRole(targetUserRole)) {
        return false
    }

    return true
}

/**
 * Check if session user can reset another user's password
 * Only system admins can reset passwords (except for their own through normal flow)
 */
export async function canResetUserPassword(targetUserId: string, targetUserRole?: string): Promise<boolean> {
    const session = await auth()
    if (!session?.user?.id) {
        return false
    }

    // Only system admin can reset passwords
    if (session.user.role !== SYSTEM_ADMIN_ROLE) {
        return false
    }

    // Cannot reset system admin passwords
    if (isSystemAdminRole(targetUserRole)) {
        return false
    }

    return true
}