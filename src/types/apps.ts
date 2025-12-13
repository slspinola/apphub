import type { 
  App, 
  OAuthClient, 
  Permission, 
  AppScopeType, 
  Plan, 
  License, 
  AppWebhook,
  AppStatus,
  LicenseStatus 
} from '@prisma/client'

// Re-export Prisma enums
export type { AppStatus, LicenseStatus }

/**
 * App with all related data
 */
export interface AppWithDetails extends App {
  oauthClient: OAuthClient | null
  permissions: Permission[]
  scopeTypes: AppScopeType[]
  plans: (Plan & { _count: { licenses: number } })[]
  webhooks?: AppWebhook[]
  _count?: {
    permissions: number
    scopeTypes: number
    plans: number
    licenses: number
    webhooks: number
  }
}

/**
 * App with stats for listing
 */
export interface AppWithStats extends App {
  _count: {
    permissions: number
    plans: number
    licenses: number
  }
}

/**
 * OAuth configuration (safe version without secret)
 */
export interface OAuthConfig {
  clientId: string
  clientSecretHint: string // Last 6 chars only
  redirectUris: string[]
  scopes: string[]
  grantTypes: string[]
  tokenLifetime: number
  refreshTokenLifetime: number
  createdAt: Date
  secretRotatedAt: Date | null
}

/**
 * OAuth credentials response (shown only once)
 */
export interface OAuthCredentials {
  clientId: string
  clientSecret: string // Full secret, shown only once
}

/**
 * Permission grouped by resource
 */
export interface PermissionGroup {
  resource: string
  groupName: string | null
  permissions: Permission[]
}

/**
 * Plan with license count
 */
export interface PlanWithStats extends Plan {
  _count: {
    licenses: number
  }
}

/**
 * License with related data
 */
export interface LicenseWithDetails extends License {
  app: Pick<App, 'id' | 'name' | 'slug' | 'icon'>
  plan: Pick<Plan, 'id' | 'name' | 'slug'>
}

/**
 * Webhook with delivery stats
 */
export interface WebhookWithStats extends AppWebhook {
  recentDeliveries?: {
    success: number
    failed: number
  }
}

/**
 * App form data for create/update
 */
export interface AppFormData {
  slug: string
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  baseUrl: string
  loginUrl?: string | null
  docsUrl?: string | null
  supportUrl?: string | null
  isPublic?: boolean
  settings?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

/**
 * Permission form data
 */
export interface PermissionFormData {
  slug: string
  name: string
  description?: string | null
  resource: string
  action: string
  groupName?: string | null
  sortOrder?: number
  isDefault?: boolean
}

/**
 * Scope type form data
 */
export interface ScopeTypeFormData {
  slug: string
  name: string
  description?: string | null
  requiresSelection?: boolean
  multiSelect?: boolean
  optionsEndpoint?: string | null
  valueSchema?: Record<string, unknown> | null
  sortOrder?: number
}

/**
 * Plan form data
 */
export interface PlanFormData {
  slug: string
  name: string
  description?: string | null
  price?: number | null
  currency?: string | null
  billingCycle?: string | null
  limits?: Record<string, number>
  features?: Record<string, boolean>
  isPublic?: boolean
  isTrial?: boolean
  trialDays?: number | null
  sortOrder?: number
}

/**
 * Webhook form data
 */
export interface WebhookFormData {
  url: string
  events: string[]
  isActive?: boolean
}

/**
 * OAuth config update data
 */
export interface OAuthConfigUpdate {
  redirectUris?: string[]
  scopes?: string[]
  grantTypes?: string[]
  tokenLifetime?: number
  refreshTokenLifetime?: number
}

/**
 * Bulk permissions sync data
 */
export interface PermissionsSyncData {
  permissions: PermissionFormData[]
}

/**
 * Bulk scope types sync data
 */
export interface ScopeTypesSyncData {
  scopeTypes: ScopeTypeFormData[]
}

/**
 * Webhook events available
 */
export const WEBHOOK_EVENTS = [
  'user.created',
  'user.updated',
  'user.deleted',
  'user.suspended',
  'user.activated',
  'entity.updated',
  'entity.settings.updated',
  'membership.created',
  'membership.updated',
  'membership.deleted',
  'license.activated',
  'license.updated',
  'license.suspended',
  'license.cancelled',
  'license.expired',
] as const

export type WebhookEvent = typeof WEBHOOK_EVENTS[number]

/**
 * App status labels for UI
 */
export const APP_STATUS_LABELS: Record<AppStatus, string> = {
  DRAFT: 'Draft',
  BETA: 'Beta',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  DEPRECATED: 'Deprecated',
  ARCHIVED: 'Archived',
}

/**
 * License status labels for UI
 */
export const LICENSE_STATUS_LABELS: Record<LicenseStatus, string> = {
  TRIAL: 'Trial',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
}

/**
 * Default OAuth scopes
 */
export const DEFAULT_OAUTH_SCOPES = [
  'openid',
  'profile', 
  'email',
  'organization',
] as const

/**
 * Available OAuth grant types
 */
export const OAUTH_GRANT_TYPES = [
  'authorization_code',
  'refresh_token',
  'client_credentials',
] as const

/**
 * Permission actions
 */
export const PERMISSION_ACTIONS = [
  'read',
  'write',
  'create',
  'update',
  'delete',
  'manage',
  'export',
  'import',
] as const

export type PermissionAction = typeof PERMISSION_ACTIONS[number]

