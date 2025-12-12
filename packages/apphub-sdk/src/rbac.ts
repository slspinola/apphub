// ============================================================================
// APPHUB SDK - Role-Based Access Control (RBAC) Module
// ============================================================================

import type {
  TenantContext,
  Permission,
  EntityRole,
  PermissionDefinition,
} from './types'

/**
 * Role hierarchy levels (higher number = more permissions)
 */
const ROLE_HIERARCHY: Record<EntityRole, number> = {
  member: 1,
  manager: 2,
  admin: 3,
  owner: 4,
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  ctx: TenantContext,
  permission: Permission
): boolean {
  return ctx.permissions.includes(permission)
}

/**
 * Check if a user has ALL of the specified permissions
 */
export function hasAllPermissions(
  ctx: TenantContext,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => ctx.permissions.includes(p))
}

/**
 * Check if a user has ANY of the specified permissions
 */
export function hasAnyPermission(
  ctx: TenantContext,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => ctx.permissions.includes(p))
}

/**
 * Check if a user has at least the specified role level
 */
export function hasRole(ctx: TenantContext, minimumRole: EntityRole): boolean {
  const userLevel = ROLE_HIERARCHY[ctx.role] ?? 0
  const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 0
  return userLevel >= requiredLevel
}

/**
 * Check if user has exact role (no hierarchy)
 */
export function hasExactRole(ctx: TenantContext, role: EntityRole): boolean {
  return ctx.role === role
}

/**
 * Check if user is entity owner
 */
export function isOwner(ctx: TenantContext): boolean {
  return ctx.role === 'owner'
}

/**
 * Check if user is admin or owner
 */
export function isAdmin(ctx: TenantContext): boolean {
  return hasRole(ctx, 'admin')
}

/**
 * Check if user is currently being impersonated
 */
export function isImpersonated(ctx: TenantContext): boolean {
  return ctx.isImpersonated
}

/**
 * Parse a permission string into resource and action
 */
export function parsePermission(permission: Permission): {
  resource: string
  action: string
} {
  const parts = permission.split(':')
  if (parts.length !== 2) {
    throw new Error(`Invalid permission format: ${permission}`)
  }
  return {
    resource: parts[0],
    action: parts[1],
  }
}

/**
 * Build a permission string from resource and action
 */
export function buildPermission(resource: string, action: string): Permission {
  return `${resource}:${action}`
}

/**
 * Get all permissions for a specific resource
 */
export function getPermissionsForResource(
  ctx: TenantContext,
  resource: string
): Permission[] {
  return ctx.permissions.filter((p) => p.startsWith(`${resource}:`))
}

/**
 * Check if user can perform an action on a resource
 */
export function canPerform(
  ctx: TenantContext,
  resource: string,
  action: string
): boolean {
  const permission = buildPermission(resource, action)
  return hasPermission(ctx, permission)
}

/**
 * Check if user can read a resource
 */
export function canRead(ctx: TenantContext, resource: string): boolean {
  return canPerform(ctx, resource, 'read')
}

/**
 * Check if user can write to a resource
 */
export function canWrite(ctx: TenantContext, resource: string): boolean {
  return canPerform(ctx, resource, 'write')
}

/**
 * Check if user can delete a resource
 */
export function canDelete(ctx: TenantContext, resource: string): boolean {
  return canPerform(ctx, resource, 'delete')
}

/**
 * Check if user can manage a resource (full control)
 */
export function canManage(ctx: TenantContext, resource: string): boolean {
  return canPerform(ctx, resource, 'manage')
}

// ============================================================================
// PERMISSION GUARD UTILITIES
// ============================================================================

/**
 * Authorization error for guard functions
 */
export class AuthorizationError extends Error {
  code: string
  requiredPermission?: Permission
  requiredRole?: EntityRole
  
  constructor(
    message: string,
    options?: { permission?: Permission; role?: EntityRole }
  ) {
    super(message)
    this.name = 'AuthorizationError'
    this.code = 'unauthorized'
    this.requiredPermission = options?.permission
    this.requiredRole = options?.role
  }
}

/**
 * Guard that throws if permission is missing
 */
export function requirePermission(
  ctx: TenantContext,
  permission: Permission
): void {
  if (!hasPermission(ctx, permission)) {
    throw new AuthorizationError(
      `Missing required permission: ${permission}`,
      { permission }
    )
  }
}

/**
 * Guard that throws if any permission is missing
 */
export function requireAllPermissions(
  ctx: TenantContext,
  permissions: Permission[]
): void {
  const missing = permissions.filter((p) => !hasPermission(ctx, p))
  if (missing.length > 0) {
    throw new AuthorizationError(
      `Missing required permissions: ${missing.join(', ')}`,
      { permission: missing[0] }
    )
  }
}

/**
 * Guard that throws if user doesn't have at least one of the permissions
 */
export function requireAnyPermission(
  ctx: TenantContext,
  permissions: Permission[]
): void {
  if (!hasAnyPermission(ctx, permissions)) {
    throw new AuthorizationError(
      `Requires one of: ${permissions.join(', ')}`,
      { permission: permissions[0] }
    )
  }
}

/**
 * Guard that throws if user doesn't have minimum role
 */
export function requireRole(ctx: TenantContext, minimumRole: EntityRole): void {
  if (!hasRole(ctx, minimumRole)) {
    throw new AuthorizationError(
      `Requires role: ${minimumRole} or higher`,
      { role: minimumRole }
    )
  }
}

/**
 * Guard that throws if user is not admin
 */
export function requireAdmin(ctx: TenantContext): void {
  requireRole(ctx, 'admin')
}

/**
 * Guard that throws if user is not owner
 */
export function requireOwner(ctx: TenantContext): void {
  requireRole(ctx, 'owner')
}

// ============================================================================
// PERMISSION DEFINITION HELPERS
// ============================================================================

/**
 * Create a permission definition
 */
export function definePermission(
  resource: string,
  action: string,
  options: Omit<PermissionDefinition, 'slug' | 'resource' | 'action'>
): PermissionDefinition {
  return {
    slug: buildPermission(resource, action),
    resource,
    action,
    ...options,
  }
}

/**
 * Define a standard CRUD permission set for a resource
 */
export function defineCrudPermissions(
  resource: string,
  displayName: string,
  options?: {
    groupName?: string
    defaultActions?: ('read' | 'write' | 'delete')[]
    includeManage?: boolean
    includeExport?: boolean
  }
): PermissionDefinition[] {
  const groupName = options?.groupName ?? displayName
  const defaultActions = options?.defaultActions ?? ['read']
  
  const permissions: PermissionDefinition[] = [
    {
      slug: `${resource}:read`,
      name: `View ${displayName}`,
      description: `View ${displayName.toLowerCase()} list and details`,
      resource,
      action: 'read',
      groupName,
      sortOrder: 0,
      isDefault: defaultActions.includes('read'),
    },
    {
      slug: `${resource}:write`,
      name: `Edit ${displayName}`,
      description: `Create and update ${displayName.toLowerCase()}`,
      resource,
      action: 'write',
      groupName,
      sortOrder: 1,
      isDefault: defaultActions.includes('write'),
    },
    {
      slug: `${resource}:delete`,
      name: `Delete ${displayName}`,
      description: `Delete ${displayName.toLowerCase()}`,
      resource,
      action: 'delete',
      groupName,
      sortOrder: 2,
      isDefault: defaultActions.includes('delete'),
    },
  ]

  if (options?.includeManage) {
    permissions.push({
      slug: `${resource}:manage`,
      name: `Manage ${displayName}`,
      description: `Full management control over ${displayName.toLowerCase()}`,
      resource,
      action: 'manage',
      groupName,
      sortOrder: 3,
    })
  }

  if (options?.includeExport) {
    permissions.push({
      slug: `${resource}:export`,
      name: `Export ${displayName}`,
      description: `Export ${displayName.toLowerCase()} data`,
      resource,
      action: 'export',
      groupName,
      sortOrder: 4,
    })
  }

  return permissions
}

// ============================================================================
// DECORATORS (for class-based handlers)
// ============================================================================

/**
 * Method decorator to require permission
 * Usage: @RequirePermission('vehicles:read')
 */
export function RequirePermission(permission: Permission) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    descriptor.value = function (this: { ctx?: TenantContext }, ...args: unknown[]) {
      const ctx = this.ctx ?? (args[0] as TenantContext)
      requirePermission(ctx, permission)
      return originalMethod.apply(this, args)
    }
    return descriptor
  }
}

/**
 * Method decorator to require minimum role
 * Usage: @RequireRole('admin')
 */
export function RequireRole(minimumRole: EntityRole) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    descriptor.value = function (this: { ctx?: TenantContext }, ...args: unknown[]) {
      const ctx = this.ctx ?? (args[0] as TenantContext)
      requireRole(ctx, minimumRole)
      return originalMethod.apply(this, args)
    }
    return descriptor
  }
}

