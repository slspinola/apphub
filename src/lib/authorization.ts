import { auth } from '@/auth'

/**
 * System Admin role constant
 */
export const SYSTEM_ADMIN_ROLE = 'system_admin'

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
export function isSystemAdminRole(role: string): boolean {
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

