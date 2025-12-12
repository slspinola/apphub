// ============================================================================
// APPHUB SDK - Scope Filtering Module (Data-Level Access Control)
// ============================================================================

import type { TenantContext, ScopeValue, ScopeTypeDefinition } from './types'

/**
 * Configuration for mapping scope types to database fields
 */
export interface ScopeFilterConfig {
  /** Field name for single customer scope */
  customer?: string
  /** Field name for multiple customers scope */
  customers?: string
  /** Field name for region scope */
  region?: string
  /** Field name for entity IDs scope */
  entityIds?: string
  /** Field name for entity ID (required for all queries) */
  entityId?: string
  /** Custom field mappings for app-specific scopes */
  custom?: Record<string, string>
}

/**
 * Apply scope filters to a Prisma-like where clause
 * Always includes entity filter for multi-tenancy
 * 
 * @param where - Existing where clause
 * @param ctx - Tenant context with scope information
 * @param config - Field mapping configuration
 * @returns Updated where clause with scope filters
 */
export function applyScopeFilter<T extends Record<string, unknown>>(
  where: T,
  ctx: TenantContext,
  config: ScopeFilterConfig = {}
): T {
  const result = { ...where }
  const entityField = config.entityId ?? 'entityId'

  // Always filter by entity
  ;(result as Record<string, unknown>)[entityField] = ctx.entity.id

  // No scope or full access - just entity filter
  if (!ctx.scope || ctx.scope.type === 'full_access') {
    return result
  }

  // Apply scope-specific filters
  const scope = ctx.scope

  switch (scope.type) {
    case 'customer':
      if (config.customer && scope.value?.customer_id) {
        ;(result as Record<string, unknown>)[config.customer] = scope.value.customer_id
      }
      break

    case 'customers':
      if (config.customers && Array.isArray(scope.value?.customer_ids)) {
        ;(result as Record<string, unknown>)[config.customers] = {
          in: scope.value.customer_ids,
        }
      }
      break

    case 'region':
      if (config.region && scope.value?.region) {
        ;(result as Record<string, unknown>)[config.region] = scope.value.region
      }
      break

    case 'entity_ids':
      if (config.entityIds && Array.isArray(scope.value?.ids)) {
        ;(result as Record<string, unknown>)[config.entityIds] = {
          in: scope.value.ids,
        }
      }
      break

    default:
      // Custom scope - apply all fields from value using custom mapping
      if (scope.value && config.custom) {
        for (const [scopeKey, dbField] of Object.entries(config.custom)) {
          if (scopeKey in scope.value) {
            const scopeValue = scope.value[scopeKey]
            if (Array.isArray(scopeValue)) {
              ;(result as Record<string, unknown>)[dbField] = { in: scopeValue }
            } else {
              ;(result as Record<string, unknown>)[dbField] = scopeValue
            }
          }
        }
      }
  }

  return result
}

/**
 * Create a scope filter function with pre-configured field mappings
 */
export function createScopeFilter(config: ScopeFilterConfig) {
  return <T extends Record<string, unknown>>(where: T, ctx: TenantContext): T => {
    return applyScopeFilter(where, ctx, config)
  }
}

/**
 * Check if a user has access to a specific record based on scope
 */
export function hasAccessToRecord(
  record: Record<string, unknown>,
  ctx: TenantContext,
  config: ScopeFilterConfig = {}
): boolean {
  const entityField = config.entityId ?? 'entityId'

  // Check entity match
  if (record[entityField] !== ctx.entity.id) {
    return false
  }

  // No scope or full access - entity check is sufficient
  if (!ctx.scope || ctx.scope.type === 'full_access') {
    return true
  }

  const scope = ctx.scope

  switch (scope.type) {
    case 'customer':
      if (config.customer && scope.value?.customer_id) {
        return record[config.customer] === scope.value.customer_id
      }
      break

    case 'customers':
      if (config.customers && Array.isArray(scope.value?.customer_ids)) {
        const value = record[config.customers]
        return scope.value.customer_ids.includes(value as string)
      }
      break

    case 'region':
      if (config.region && scope.value?.region) {
        return record[config.region] === scope.value.region
      }
      break

    case 'entity_ids':
      if (config.entityIds && Array.isArray(scope.value?.ids)) {
        const value = record[config.entityIds]
        return scope.value.ids.includes(value as string)
      }
      break

    default:
      // Custom scope - check all fields from custom mapping
      if (scope.value && config.custom) {
        for (const [scopeKey, dbField] of Object.entries(config.custom)) {
          if (scopeKey in scope.value) {
            const scopeValue = scope.value[scopeKey]
            const recordValue = record[dbField]
            if (Array.isArray(scopeValue)) {
              if (!scopeValue.includes(recordValue as string)) {
                return false
              }
            } else if (recordValue !== scopeValue) {
              return false
            }
          }
        }
      }
  }

  return true
}

/**
 * Filter an array of records based on scope
 */
export function filterRecordsByScope<T extends Record<string, unknown>>(
  records: T[],
  ctx: TenantContext,
  config: ScopeFilterConfig = {}
): T[] {
  return records.filter((record) => hasAccessToRecord(record, ctx, config))
}

/**
 * Guard function that throws if user doesn't have access to record
 */
export function requireAccessToRecord(
  record: Record<string, unknown>,
  ctx: TenantContext,
  config: ScopeFilterConfig = {}
): void {
  if (!hasAccessToRecord(record, ctx, config)) {
    throw new ScopeAccessError('Access denied to this record')
  }
}

/**
 * Scope access error class
 */
export class ScopeAccessError extends Error {
  code: string
  
  constructor(message: string) {
    super(message)
    this.name = 'ScopeAccessError'
    this.code = 'scope_access_denied'
  }
}

// ============================================================================
// SCOPE TYPE DEFINITION HELPERS
// ============================================================================

/**
 * Define a full access scope type (no restrictions)
 */
export function defineFullAccessScope(): ScopeTypeDefinition {
  return {
    slug: 'full_access',
    name: 'Full Access',
    description: 'Access to all organization data without restrictions',
    requiresSelection: false,
    sortOrder: 0,
  }
}

/**
 * Define a customer scope type
 */
export function defineCustomerScope(options?: {
  name?: string
  description?: string
  multiSelect?: boolean
  optionsEndpoint?: string
}): ScopeTypeDefinition {
  return {
    slug: options?.multiSelect ? 'customers' : 'customer',
    name: options?.name ?? (options?.multiSelect ? 'Customers' : 'Customer'),
    description: options?.description ?? 'Limit access to specific customer(s)',
    requiresSelection: true,
    multiSelect: options?.multiSelect ?? false,
    optionsEndpoint: options?.optionsEndpoint ?? '/api/v1/scope-options/customers',
    sortOrder: 1,
  }
}

/**
 * Define a region scope type
 */
export function defineRegionScope(options?: {
  name?: string
  description?: string
  optionsEndpoint?: string
}): ScopeTypeDefinition {
  return {
    slug: 'region',
    name: options?.name ?? 'Region',
    description: options?.description ?? 'Limit access to a geographic region',
    requiresSelection: true,
    multiSelect: false,
    optionsEndpoint: options?.optionsEndpoint ?? '/api/v1/scope-options/regions',
    sortOrder: 2,
  }
}

/**
 * Define a custom scope type
 */
export function defineCustomScope(
  slug: string,
  options: Omit<ScopeTypeDefinition, 'slug'>
): ScopeTypeDefinition {
  return {
    slug,
    ...options,
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get scope type from context
 */
export function getScopeType(ctx: TenantContext): string | null {
  return ctx.scope?.type ?? null
}

/**
 * Get scope value from context
 */
export function getScopeValue<T = Record<string, unknown>>(
  ctx: TenantContext
): T | null {
  return (ctx.scope?.value as T) ?? null
}

/**
 * Check if context has full access (no scope restrictions)
 */
export function hasFullAccess(ctx: TenantContext): boolean {
  return !ctx.scope || ctx.scope.type === 'full_access'
}

/**
 * Check if context has a specific scope type
 */
export function hasScopeType(ctx: TenantContext, scopeType: string): boolean {
  return ctx.scope?.type === scopeType
}

/**
 * Build scope options response for AppHub
 */
export interface ScopeOptionItem {
  id: string
  name: string
  meta?: Record<string, unknown>
}

export function buildScopeOptionsResponse(items: ScopeOptionItem[]): {
  data: ScopeOptionItem[]
} {
  return { data: items }
}

