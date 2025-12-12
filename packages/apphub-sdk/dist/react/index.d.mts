import { a as AppHubUser, b as AppHubEntity, E as EntityRole, P as Permission } from '../types-9KxXXUK5.mjs';
export { T as TenantContext } from '../types-9KxXXUK5.mjs';

/**
 * Note: This module provides client-side utilities for React applications.
 * For full Next.js integration with server components, use @apphub/sdk/nextjs
 */

/**
 * Client-side session data (subset of TenantContext safe for client)
 */
interface ClientSession {
    user: AppHubUser;
    entity: AppHubEntity;
    role: EntityRole;
    permissions: Permission[];
    isImpersonated: boolean;
}
/**
 * Check if user has a specific permission
 */
declare function hasPermission(session: ClientSession | null, permission: Permission): boolean;
/**
 * Check if user has ALL specified permissions
 */
declare function hasAllPermissions(session: ClientSession | null, permissions: Permission[]): boolean;
/**
 * Check if user has ANY of the specified permissions
 */
declare function hasAnyPermission(session: ClientSession | null, permissions: Permission[]): boolean;
/**
 * Check if user has at least the specified role level
 */
declare function hasRole(session: ClientSession | null, minimumRole: EntityRole): boolean;
/**
 * Check if user is entity owner
 */
declare function isOwner(session: ClientSession | null): boolean;
/**
 * Check if user is admin or owner
 */
declare function isAdmin(session: ClientSession | null): boolean;
/**
 * Check if user can perform action on resource
 */
declare function canPerform(session: ClientSession | null, resource: string, action: string): boolean;
/**
 * Check if user can read resource
 */
declare function canRead(session: ClientSession | null, resource: string): boolean;
/**
 * Check if user can write to resource
 */
declare function canWrite(session: ClientSession | null, resource: string): boolean;
/**
 * Check if user can delete resource
 */
declare function canDelete(session: ClientSession | null, resource: string): boolean;
/**
 * Props for permission-based conditional rendering
 */
interface PermissionGateProps {
    /** Required permission(s) */
    permission?: Permission | Permission[];
    /** If true, require ALL permissions (default: require ANY) */
    requireAll?: boolean;
    /** Required minimum role */
    role?: EntityRole;
    /** Current session */
    session: ClientSession | null;
    /** Content to show if authorized */
    children: React.ReactNode;
    /** Content to show if not authorized */
    fallback?: React.ReactNode;
}
/**
 * Check if user passes permission/role gate
 * Use this to implement your own PermissionGate component
 */
declare function checkGateAccess(session: ClientSession | null, options: {
    permission?: Permission | Permission[];
    requireAll?: boolean;
    role?: EntityRole;
}): boolean;
/**
 * Extract permissions for a specific resource
 */
declare function getResourcePermissions(session: ClientSession | null, resource: string): Permission[];
/**
 * Get list of resources user has any permission for
 */
declare function getAccessibleResources(session: ClientSession | null): string[];
/**
 * Check if user has access to any resource
 */
declare function hasAnyAccess(session: ClientSession | null): boolean;
/**
 * Convert NextAuth.js session to ClientSession
 */
declare function toClientSession(session: {
    user?: {
        id?: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
        entityId?: string;
        entityName?: string;
        entitySlug?: string;
        role?: EntityRole;
        permissions?: Permission[];
    };
} | null): ClientSession | null;
/**
 * Determine which navigation items to show based on permissions
 */
interface NavItem {
    id: string;
    label: string;
    href: string;
    permission?: Permission;
    role?: EntityRole;
    icon?: string;
}
declare function filterNavItems(items: NavItem[], session: ClientSession | null): NavItem[];
/**
 * Get user's display name or fallback
 */
declare function getUserDisplayName(session: ClientSession | null, fallback?: string): string;
/**
 * Get user's initials for avatar
 */
declare function getUserInitials(session: ClientSession | null): string;

export { AppHubEntity, AppHubUser, type ClientSession, EntityRole, type NavItem, Permission, type PermissionGateProps, canDelete, canPerform, canRead, canWrite, checkGateAccess, filterNavItems, getAccessibleResources, getResourcePermissions, getUserDisplayName, getUserInitials, hasAllPermissions, hasAnyAccess, hasAnyPermission, hasPermission, hasRole, isAdmin, isOwner, toClientSession };
