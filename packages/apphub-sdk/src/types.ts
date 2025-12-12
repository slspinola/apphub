// ============================================================================
// APPHUB SDK - Type Definitions
// ============================================================================

/**
 * AppHub SDK Configuration
 */
export interface AppHubConfig {
  /** AppHub base URL (e.g., https://hub.example.com) */
  hubUrl: string
  /** Your application's client ID from AppHub */
  clientId: string
  /** Your application's client secret from AppHub */
  clientSecret: string
  /** Your application's unique slug */
  appSlug: string
  /** Optional: Custom redirect URI */
  redirectUri?: string
  /** Optional: Webhook secret for signature verification */
  webhookSecret?: string
  /** Optional: Public key for JWT verification (auto-fetched if not provided) */
  publicKey?: string
}

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

/**
 * Authenticated user information
 */
export interface AppHubUser {
  /** Unique user ID */
  id: string
  /** User's email address */
  email: string
  /** User's display name */
  name: string | null
  /** User's avatar URL */
  image: string | null
}

/**
 * Entity (organization) information
 */
export interface AppHubEntity {
  /** Unique entity ID */
  id: string
  /** Entity display name */
  name: string
  /** Entity URL-safe slug */
  slug: string
  /** Entity logo URL */
  logo?: string | null
}

/**
 * User's role within an entity
 */
export type EntityRole = 'owner' | 'admin' | 'manager' | 'member'

/**
 * System-level roles (platform-wide)
 */
export type SystemRole = 'system_admin' | 'user'

// ============================================================================
// SCOPES & PERMISSIONS
// ============================================================================

/**
 * Scope value structure for data-level access control
 */
export interface ScopeValue {
  /** Scope type identifier */
  type: string
  /** Scope value (null for full_access) */
  value: Record<string, unknown> | null
}

/**
 * Permission string format: "{resource}:{action}"
 * Examples: "vehicles:read", "drivers:write", "reports:export"
 */
export type Permission = string

/**
 * Common permission actions
 */
export type PermissionAction = 'read' | 'write' | 'delete' | 'manage' | 'export'

/**
 * Permission definition (for registering with AppHub)
 */
export interface PermissionDefinition {
  /** Unique permission slug (e.g., "vehicles:read") */
  slug: string
  /** Display name */
  name: string
  /** Description of what this permission allows */
  description?: string
  /** Resource this permission applies to */
  resource: string
  /** Action type */
  action: string
  /** UI grouping name */
  groupName?: string
  /** Sort order for display */
  sortOrder?: number
  /** Whether this is a system permission (non-editable) */
  isSystem?: boolean
  /** Whether included by default in new roles */
  isDefault?: boolean
}

/**
 * Scope type definition (for registering with AppHub)
 */
export interface ScopeTypeDefinition {
  /** Unique scope type slug */
  slug: string
  /** Display name */
  name: string
  /** Description */
  description?: string
  /** Whether user must select a value */
  requiresSelection: boolean
  /** Whether multiple values can be selected */
  multiSelect?: boolean
  /** Endpoint for fetching options */
  optionsEndpoint?: string
  /** JSON Schema for value validation */
  valueSchema?: Record<string, unknown>
  /** Sort order for display */
  sortOrder?: number
}

// ============================================================================
// JWT TOKEN
// ============================================================================

/**
 * JWT Access Token payload from AppHub
 */
export interface AppHubTokenPayload {
  /** Token issuer (AppHub URL) */
  iss: string
  /** Subject (user ID) */
  sub: string
  /** Audience (app slugs) */
  aud: string | string[]
  /** Expiration timestamp */
  exp: number
  /** Issued at timestamp */
  iat: number
  /** Unique token ID */
  jti: string
  /** Authorized party (client ID that requested the token) */
  azp?: string
  /** OAuth scope string (space-separated scopes) */
  scope?: string
  
  // User information
  /** User's email */
  email: string
  /** User's display name */
  name: string | null
  /** User's avatar URL */
  image?: string | null
  
  // Entity context
  /** Current entity ID */
  entity_id: string
  /** Entity display name */
  entity_name: string
  /** Entity slug */
  entity_slug: string
  
  // Authorization
  /** User's role in entity */
  role: EntityRole
  /** Granted permissions for this app */
  permissions: Permission[]
  /** Data access scopes per app */
  scopes?: Record<string, ScopeValue>
  /** Apps the entity is licensed for */
  licensed_apps: string[]
  
  // Impersonation (if applicable)
  /** Present if user is being impersonated */
  impersonated_by?: {
    id: string
    email: string
    role: string
  } | null
}

// ============================================================================
// TENANT CONTEXT
// ============================================================================

/**
 * Impersonator information
 */
export interface ImpersonatorInfo {
  /** Impersonator user ID */
  id: string
  /** Impersonator email */
  email: string
  /** Impersonator role */
  role: string
}

/**
 * Complete tenant context extracted from authenticated request
 */
export interface TenantContext {
  /** Authenticated user */
  user: AppHubUser
  /** Current entity */
  entity: AppHubEntity
  /** User's role in entity */
  role: EntityRole
  /** Granted permissions */
  permissions: Permission[]
  /** App-specific scope for data filtering */
  scope: ScopeValue | null
  /** Whether user is currently being impersonated */
  isImpersonated: boolean
  /** Impersonator info (if impersonated) */
  impersonatedBy: ImpersonatorInfo | null
  /** Licensed apps for this entity */
  licensedApps: string[]
  /** Raw token payload for advanced use cases */
  tokenPayload: AppHubTokenPayload
}

// ============================================================================
// OAUTH
// ============================================================================

/**
 * OAuth authorization parameters
 */
export interface AuthorizationParams {
  /** Random state for CSRF protection */
  state: string
  /** PKCE code verifier (to be stored in session) */
  codeVerifier: string
  /** PKCE code challenge (to be sent to AppHub) */
  codeChallenge: string
  /** Full authorization URL */
  authorizationUrl: string
  /** OpenID Connect nonce (for ID token validation) */
  nonce?: string
}

/**
 * OAuth token response from AppHub
 */
export interface TokenResponse {
  /** JWT access token */
  access_token: string
  /** Token type (always "Bearer") */
  token_type: 'Bearer'
  /** Seconds until access token expires */
  expires_in: number
  /** Refresh token for obtaining new access tokens */
  refresh_token: string
  /** OpenID Connect ID token */
  id_token?: string
}

/**
 * OAuth error response
 */
export interface OAuthError {
  error: string
  error_description?: string
}

/**
 * OpenID Connect Discovery Configuration
 */
export interface OIDCConfiguration {
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
  userinfo_endpoint: string
  jwks_uri: string
  revocation_endpoint?: string
  introspection_endpoint?: string
  scopes_supported: string[]
  response_types_supported: string[]
  response_modes_supported: string[]
  grant_types_supported: string[]
  token_endpoint_auth_methods_supported: string[]
  id_token_signing_alg_values_supported: string[]
  code_challenge_methods_supported: string[]
  claims_supported: string[]
  subject_types_supported: string[]
  revocation_endpoint_auth_methods_supported?: string[]
  introspection_endpoint_auth_methods_supported?: string[]
}

/**
 * Token introspection response
 */
export interface TokenIntrospectionResponse {
  active: boolean
  scope?: string
  client_id?: string
  username?: string
  exp?: number
  iat?: number
  sub?: string
  aud?: string | string[]
  iss?: string
  jti?: string
  token_type?: string
  [key: string]: unknown
}

// ============================================================================
// WEBHOOK
// ============================================================================

/**
 * Webhook event types
 */
export type WebhookEventType =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.suspended'
  | 'user.activated'
  | 'entity.updated'
  | 'entity.settings.updated'
  | 'membership.created'
  | 'membership.updated'
  | 'membership.deleted'
  | 'license.activated'
  | 'license.updated'
  | 'license.suspended'
  | 'license.cancelled'
  | 'license.expired'

/**
 * Actor who triggered the webhook event
 */
export interface WebhookActor {
  type: 'user' | 'system' | 'api'
  id?: string
  email?: string
}

/**
 * Webhook event payload
 */
export interface WebhookEvent<T = Record<string, unknown>> {
  /** Unique event ID */
  id: string
  /** Event type */
  type: WebhookEventType
  /** Event timestamp */
  timestamp: string
  /** App that this event is for */
  appId: string
  /** Entity context */
  entity: {
    id: string
    slug: string
  }
  /** Event-specific data */
  data: T
  /** Who triggered this event */
  actor: WebhookActor
}

// ============================================================================
// WEBHOOK EVENT DATA TYPES
// ============================================================================

export interface UserEventData {
  userId: string
  email: string
  name: string
  role?: EntityRole
  permissions?: Permission[]
  scope?: ScopeValue
}

export interface MembershipEventData {
  userId: string
  email: string
  name: string
  previousRole?: EntityRole
  newRole?: EntityRole
  previousPermissions?: Permission[]
  newPermissions?: Permission[]
  previousScope?: ScopeValue
  newScope?: ScopeValue
}

export interface LicenseEventData {
  licenseId: string
  planId: string
  planSlug: string
  status: 'trial' | 'active' | 'suspended' | 'cancelled' | 'expired'
  validFrom: string
  validUntil?: string
}

// ============================================================================
// API RESPONSES
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  data: T
  meta?: {
    total?: number
    page?: number
    perPage?: number
  }
}

/**
 * API error response
 */
export interface ApiError {
  error: string
  message: string
  statusCode: number
  details?: Record<string, unknown>
}

// ============================================================================
// SCOPE OPTIONS
// ============================================================================

/**
 * Scope option for selection UI
 */
export interface ScopeOption {
  /** Option ID/value */
  id: string
  /** Display name */
  name: string
  /** Additional metadata for display */
  meta?: Record<string, unknown>
}

// ============================================================================
// LICENSE & PLAN
// ============================================================================

/**
 * License status
 */
export type LicenseStatus = 'trial' | 'active' | 'suspended' | 'cancelled' | 'expired'

/**
 * License information
 */
export interface License {
  id: string
  entityId: string
  appId: string
  planId: string
  status: LicenseStatus
  validFrom: string
  validUntil?: string | null
  trialEndsAt?: string | null
  limits: Record<string, number>
  features: Record<string, boolean>
}

/**
 * Plan information
 */
export interface Plan {
  id: string
  slug: string
  name: string
  description?: string
  price?: number
  currency?: string
  billingCycle?: 'monthly' | 'yearly' | 'one-time'
  limits: Record<string, number>
  features: Record<string, boolean>
  isTrial: boolean
  trialDays?: number
}

// ============================================================================
// APP REGISTRATION
// ============================================================================

/**
 * App status in AppHub
 */
export type AppStatus = 'draft' | 'beta' | 'active' | 'suspended' | 'deprecated' | 'archived'

/**
 * App information
 */
export interface App {
  id: string
  slug: string
  name: string
  description?: string
  icon?: string
  color?: string
  baseUrl: string
  status: AppStatus
  isCore: boolean
  isPublic: boolean
}

