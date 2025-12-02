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
