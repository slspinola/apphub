// ============================================================================
// APPHUB SDK - React Integration (Client-Side Utilities)
// ============================================================================

/**
 * Note: This module provides client-side utilities for React applications.
 * For full Next.js integration with server components, use @apphub/sdk/nextjs
 */

import type {
  TenantContext,
  Permission,
  EntityRole,
  AppHubUser,
  AppHubEntity,
} from '../types'

export type { TenantContext, Permission, EntityRole, AppHubUser, AppHubEntity }

// ============================================================================
// CONTEXT TYPE FOR REACT
// ============================================================================

/**
 * Client-side session data (subset of TenantContext safe for client)
 */
export interface ClientSession {
  user: AppHubUser
  entity: AppHubEntity
  role: EntityRole
  permissions: Permission[]
  isImpersonated: boolean
}

// ============================================================================
// PERMISSION CHECKING (CLIENT-SIDE)
// ============================================================================

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  session: ClientSession | null,
  permission: Permission
): boolean {
  return session?.permissions?.includes(permission) ?? false
}

/**
 * Check if user has ALL specified permissions
 */
export function hasAllPermissions(
  session: ClientSession | null,
  permissions: Permission[]
): boolean {
  if (!session?.permissions) return false
  return permissions.every(p => session.permissions.includes(p))
}

/**
 * Check if user has ANY of the specified permissions
 */
export function hasAnyPermission(
  session: ClientSession | null,
  permissions: Permission[]
): boolean {
  if (!session?.permissions) return false
  return permissions.some(p => session.permissions.includes(p))
}

/**
 * Role hierarchy for comparison
 */
const ROLE_HIERARCHY: Record<EntityRole, number> = {
  member: 1,
  manager: 2,
  admin: 3,
  owner: 4,
}

/**
 * Check if user has at least the specified role level
 */
export function hasRole(
  session: ClientSession | null,
  minimumRole: EntityRole
): boolean {
  if (!session?.role) return false
  const userLevel = ROLE_HIERARCHY[session.role] ?? 0
  const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 0
  return userLevel >= requiredLevel
}

/**
 * Check if user is entity owner
 */
export function isOwner(session: ClientSession | null): boolean {
  return session?.role === 'owner'
}

/**
 * Check if user is admin or owner
 */
export function isAdmin(session: ClientSession | null): boolean {
  return hasRole(session, 'admin')
}

/**
 * Check if user can perform action on resource
 */
export function canPerform(
  session: ClientSession | null,
  resource: string,
  action: string
): boolean {
  return hasPermission(session, `${resource}:${action}`)
}

/**
 * Check if user can read resource
 */
export function canRead(session: ClientSession | null, resource: string): boolean {
  return canPerform(session, resource, 'read')
}

/**
 * Check if user can write to resource
 */
export function canWrite(session: ClientSession | null, resource: string): boolean {
  return canPerform(session, resource, 'write')
}

/**
 * Check if user can delete resource
 */
export function canDelete(session: ClientSession | null, resource: string): boolean {
  return canPerform(session, resource, 'delete')
}

// ============================================================================
// REACT COMPONENT HELPERS
// ============================================================================

/**
 * Props for permission-based conditional rendering
 */
export interface PermissionGateProps {
  /** Required permission(s) */
  permission?: Permission | Permission[]
  /** If true, require ALL permissions (default: require ANY) */
  requireAll?: boolean
  /** Required minimum role */
  role?: EntityRole
  /** Current session */
  session: ClientSession | null
  /** Content to show if authorized */
  children: React.ReactNode
  /** Content to show if not authorized */
  fallback?: React.ReactNode
}

/**
 * Check if user passes permission/role gate
 * Use this to implement your own PermissionGate component
 */
export function checkGateAccess(
  session: ClientSession | null,
  options: {
    permission?: Permission | Permission[]
    requireAll?: boolean
    role?: EntityRole
  }
): boolean {
  const { permission, requireAll, role } = options

  // Check role if specified
  if (role && !hasRole(session, role)) {
    return false
  }

  // Check permission if specified
  if (permission) {
    const permissions = Array.isArray(permission) ? permission : [permission]
    if (requireAll) {
      if (!hasAllPermissions(session, permissions)) {
        return false
      }
    } else {
      if (!hasAnyPermission(session, permissions)) {
        return false
      }
    }
  }

  return true
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract permissions for a specific resource
 */
export function getResourcePermissions(
  session: ClientSession | null,
  resource: string
): Permission[] {
  if (!session?.permissions) return []
  return session.permissions.filter(p => p.startsWith(`${resource}:`))
}

/**
 * Get list of resources user has any permission for
 */
export function getAccessibleResources(session: ClientSession | null): string[] {
  if (!session?.permissions) return []
  const resources = new Set<string>()
  for (const permission of session.permissions) {
    const [resource] = permission.split(':')
    resources.add(resource)
  }
  return Array.from(resources)
}

/**
 * Check if user has access to any resource
 */
export function hasAnyAccess(session: ClientSession | null): boolean {
  return (session?.permissions?.length ?? 0) > 0
}

// ============================================================================
// SESSION UTILITIES
// ============================================================================

/**
 * Convert NextAuth.js session to ClientSession
 */
export function toClientSession(session: {
  user?: {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
    entityId?: string
    entityName?: string
    entitySlug?: string
    role?: EntityRole
    permissions?: Permission[]
  }
} | null): ClientSession | null {
  if (!session?.user?.entityId) return null

  const user = session.user
  
  return {
    user: {
      id: user.id ?? '',
      email: user.email ?? '',
      name: user.name ?? null,
      image: user.image ?? null,
    },
    entity: {
      id: user.entityId!, // Guaranteed by the check above
      name: user.entityName ?? '',
      slug: user.entitySlug ?? '',
    },
    role: user.role ?? 'member',
    permissions: user.permissions ?? [],
    isImpersonated: false,
  }
}

// ============================================================================
// UI STATE HELPERS
// ============================================================================

/**
 * Determine which navigation items to show based on permissions
 */
export interface NavItem {
  id: string
  label: string
  href: string
  permission?: Permission
  role?: EntityRole
  icon?: string
}

export function filterNavItems(
  items: NavItem[],
  session: ClientSession | null
): NavItem[] {
  return items.filter(item => {
    if (item.permission && !hasPermission(session, item.permission)) {
      return false
    }
    if (item.role && !hasRole(session, item.role)) {
      return false
    }
    return true
  })
}

/**
 * Get user's display name or fallback
 */
export function getUserDisplayName(
  session: ClientSession | null,
  fallback = 'User'
): string {
  return session?.user?.name || session?.user?.email || fallback
}

/**
 * Get user's initials for avatar
 */
export function getUserInitials(session: ClientSession | null): string {
  const name = session?.user?.name
  if (name) {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  const email = session?.user?.email
  if (email) {
    return email.slice(0, 2).toUpperCase()
  }
  return '??'
}

