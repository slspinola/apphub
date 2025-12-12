// ============================================================================
// APPHUB SDK - Main Entry Point
// ============================================================================

/**
 * @apphub/sdk
 * 
 * Official SDK for integrating applications with AppHub authentication
 * and authorization system.
 * 
 * ## Quick Start
 * 
 * ```typescript
 * import { createAppHubClient } from '@apphub/sdk'
 * 
 * const apphub = createAppHubClient({
 *   hubUrl: process.env.APPHUB_URL!,
 *   clientId: process.env.APPHUB_CLIENT_ID!,
 *   clientSecret: process.env.APPHUB_CLIENT_SECRET!,
 *   appSlug: 'myapp',
 * })
 * 
 * // Validate token and get context
 * const ctx = await apphub.jwt.getTenantContext(token)
 * 
 * // Check permissions
 * if (hasPermission(ctx, 'vehicles:read')) {
 *   // ...
 * }
 * ```
 * 
 * ## Framework-Specific Imports
 * 
 * ```typescript
 * // Next.js with NextAuth.js
 * import { createAppHubProvider } from '@apphub/sdk/nextjs'
 * 
 * // React client utilities
 * import { hasPermission, hasRole } from '@apphub/sdk/react'
 * ```
 */

import type { AppHubConfig } from './types'
import { AppHubOAuth, createOAuthClient } from './oauth'
import { AppHubJWT, createJWTValidator } from './jwt'
import { AppHubApiClient, createApiClient } from './api'
import { WebhookProcessor, createWebhookProcessor } from './webhook'

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Configuration
  AppHubConfig,
  
  // User & Authentication
  AppHubUser,
  AppHubEntity,
  EntityRole,
  SystemRole,
  ImpersonatorInfo,
  
  // Scopes & Permissions
  ScopeValue,
  Permission,
  PermissionAction,
  PermissionDefinition,
  ScopeTypeDefinition,
  
  // JWT Token
  AppHubTokenPayload,
  
  // Tenant Context
  TenantContext,
  
  // OAuth
  AuthorizationParams,
  TokenResponse,
  OAuthError,
  OIDCConfiguration,
  TokenIntrospectionResponse,
  
  // Webhooks
  WebhookEventType,
  WebhookEvent,
  WebhookActor,
  UserEventData,
  MembershipEventData,
  LicenseEventData,
  
  // API
  ApiResponse,
  ApiError,
  ScopeOption,
  License,
  LicenseStatus,
  Plan,
  App,
  AppStatus,
} from './types'

// ============================================================================
// OAUTH
// ============================================================================

export {
  AppHubOAuth,
  AppHubOAuthError,
  createOAuthClient,
} from './oauth'

// ============================================================================
// JWT
// ============================================================================

export {
  AppHubJWT,
  AppHubJWTError,
  createJWTValidator,
  extractBearerToken,
  extractTokenFromRequest,
} from './jwt'

export type { JWTValidationOptions, JWTValidationResult } from './jwt'

// ============================================================================
// RBAC
// ============================================================================

export {
  // Permission checks
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  hasRole,
  hasExactRole,
  isOwner,
  isAdmin,
  isImpersonated,
  
  // Resource helpers
  parsePermission,
  buildPermission,
  getPermissionsForResource,
  canPerform,
  canRead,
  canWrite,
  canDelete,
  canManage,
  
  // Guards
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  requireRole,
  requireAdmin,
  requireOwner,
  AuthorizationError,
  
  // Definition helpers
  definePermission,
  defineCrudPermissions,
  
  // Decorators
  RequirePermission,
  RequireRole,
} from './rbac'

// ============================================================================
// SCOPE
// ============================================================================

export {
  // Filtering
  applyScopeFilter,
  createScopeFilter,
  hasAccessToRecord,
  filterRecordsByScope,
  requireAccessToRecord,
  ScopeAccessError,
  
  // Scope definition helpers
  defineFullAccessScope,
  defineCustomerScope,
  defineRegionScope,
  defineCustomScope,
  
  // Utilities
  getScopeType,
  getScopeValue,
  hasFullAccess,
  hasScopeType,
  buildScopeOptionsResponse,
} from './scope'

export type { ScopeFilterConfig, ScopeOptionItem } from './scope'

// ============================================================================
// WEBHOOK
// ============================================================================

export {
  verifyWebhookSignature,
  parseWebhookRequest,
  WebhookProcessor,
  WebhookError,
  createWebhookProcessor,
  createNextJSWebhookHandler,
} from './webhook'

export type { WebhookHandler, WebhookHandlerMap, NextJSWebhookOptions } from './webhook'

// ============================================================================
// API CLIENT
// ============================================================================

export {
  AppHubApiClient,
  AppHubApiError,
  createApiClient,
} from './api'

// ============================================================================
// MAIN CLIENT
// ============================================================================

/**
 * Complete AppHub client with all modules
 */
export interface AppHubClient {
  /** OAuth authentication client */
  oauth: AppHubOAuth
  /** JWT token validator */
  jwt: AppHubJWT
  /** API client for AppHub endpoints */
  api: AppHubApiClient
  /** Webhook processor (only if webhookSecret provided) */
  webhooks?: WebhookProcessor
  /** SDK configuration */
  config: AppHubConfig
}

/**
 * Create a complete AppHub client
 * 
 * @example
 * ```typescript
 * const apphub = createAppHubClient({
 *   hubUrl: 'https://hub.example.com',
 *   clientId: 'myapp_client_123',
 *   clientSecret: 'secret_xyz',
 *   appSlug: 'myapp',
 *   webhookSecret: 'whsec_abc',
 * })
 * 
 * // Initialize OIDC discovery (optional, but recommended)
 * await apphub.oauth.initialize()
 * 
 * // OAuth flow
 * const { authorizationUrl, codeVerifier, state, nonce } = 
 *   await apphub.oauth.createAuthorizationUrl({
 *     redirectUri: 'https://myapp.com/callback'
 *   })
 * 
 * // Validate tokens
 * const ctx = await apphub.jwt.getTenantContext(accessToken)
 * 
 * // Introspect token
 * const introspection = await apphub.oauth.introspectToken(accessToken)
 * 
 * // Register permissions
 * await apphub.api.syncPermissions([
 *   { slug: 'items:read', name: 'View Items', ... }
 * ])
 * 
 * // Handle webhooks
 * apphub.webhooks?.onUserCreated(async (event) => {
 *   console.log('New user:', event.data)
 * })
 * ```
 */
export function createAppHubClient(config: AppHubConfig): AppHubClient {
  const oauth = createOAuthClient(config)
  const jwt = createJWTValidator(config)
  const api = createApiClient(config)

  // Wrap oauth.initialize to sync issuer and JWKS URL from OIDC discovery
  const originalInitialize = oauth.initialize.bind(oauth)
  oauth.initialize = async () => {
    await originalInitialize()
    try {
      const oidcConfig = await oauth.getConfiguration()
      jwt.setIssuer(oidcConfig.issuer)
      jwt.setJwksUrl(oidcConfig.jwks_uri)
    } catch (error) {
      // If discovery fails, continue with default values
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('Failed to sync OIDC configuration to JWT validator:', error)
      }
    }
  }

  const client: AppHubClient = {
    oauth,
    jwt,
    api,
    config,
  }

  if (config.webhookSecret) {
    client.webhooks = createWebhookProcessor(config.webhookSecret)
  }

  return client
}

// ============================================================================
// VERSION
// ============================================================================

export const SDK_VERSION = '1.0.0'

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default createAppHubClient

