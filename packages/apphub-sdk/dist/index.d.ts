import { A as AppHubConfig } from './types-9KxXXUK5.js';
export { m as ApiError, l as ApiResponse, r as App, b as AppHubEntity, g as AppHubTokenPayload, a as AppHubUser, s as AppStatus, h as AuthorizationParams, E as EntityRole, o as License, L as LicenseEventData, p as LicenseStatus, M as MembershipEventData, O as OAuthError, P as Permission, d as PermissionAction, e as PermissionDefinition, q as Plan, n as ScopeOption, f as ScopeTypeDefinition, c as ScopeValue, S as SystemRole, T as TenantContext, i as TokenResponse, U as UserEventData, k as WebhookActor, j as WebhookEvent, W as WebhookEventType } from './types-9KxXXUK5.js';
import { A as AppHubOAuth, a as AppHubJWT, b as AppHubApiClient, W as WebhookProcessor } from './scope-CHFtQhBE.js';
export { aa as AppHubApiError, e as AppHubJWTError, c as AppHubOAuthError, G as AuthorizationError, J as JWTValidationOptions, i as JWTValidationResult, a9 as NextJSWebhookOptions, R as RequirePermission, K as RequireRole, S as ScopeAccessError, a0 as ScopeFilterConfig, a1 as ScopeOptionItem, a4 as WebhookError, a7 as WebhookHandler, a8 as WebhookHandlerMap, L as applyScopeFilter, s as buildPermission, $ as buildScopeOptionsResponse, x as canDelete, y as canManage, u as canPerform, v as canRead, w as canWrite, ab as createApiClient, f as createJWTValidator, a6 as createNextJSWebhookHandler, d as createOAuthClient, M as createScopeFilter, a5 as createWebhookProcessor, I as defineCrudPermissions, V as defineCustomScope, T as defineCustomerScope, Q as defineFullAccessScope, H as definePermission, U as defineRegionScope, g as extractBearerToken, h as extractTokenFromRequest, O as filterRecordsByScope, t as getPermissionsForResource, X as getScopeType, Y as getScopeValue, N as hasAccessToRecord, k as hasAllPermissions, l as hasAnyPermission, n as hasExactRole, Z as hasFullAccess, j as hasPermission, m as hasRole, _ as hasScopeType, p as isAdmin, q as isImpersonated, o as isOwner, r as parsePermission, a3 as parseWebhookRequest, P as requireAccessToRecord, E as requireAdmin, B as requireAllPermissions, C as requireAnyPermission, F as requireOwner, z as requirePermission, D as requireRole, a2 as verifyWebhookSignature } from './scope-CHFtQhBE.js';

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

/**
 * Complete AppHub client with all modules
 */
interface AppHubClient {
    /** OAuth authentication client */
    oauth: AppHubOAuth;
    /** JWT token validator */
    jwt: AppHubJWT;
    /** API client for AppHub endpoints */
    api: AppHubApiClient;
    /** Webhook processor (only if webhookSecret provided) */
    webhooks?: WebhookProcessor;
    /** SDK configuration */
    config: AppHubConfig;
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
 * // OAuth flow
 * const { authorizationUrl, codeVerifier, state } =
 *   await apphub.oauth.createAuthorizationUrl({
 *     redirectUri: 'https://myapp.com/callback'
 *   })
 *
 * // Validate tokens
 * const ctx = await apphub.jwt.getTenantContext(accessToken)
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
declare function createAppHubClient(config: AppHubConfig): AppHubClient;
declare const SDK_VERSION = "1.0.0";

export { AppHubApiClient, type AppHubClient, AppHubConfig, AppHubJWT, AppHubOAuth, SDK_VERSION, WebhookProcessor, createAppHubClient, createAppHubClient as default };
