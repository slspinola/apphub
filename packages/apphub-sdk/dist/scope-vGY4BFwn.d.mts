import { A as AppHubConfig, h as AuthorizationParams, i as TokenResponse, g as AppHubTokenPayload, T as TenantContext, r as App, e as PermissionDefinition, f as ScopeTypeDefinition, q as Plan, o as License, n as ScopeOption, W as WebhookEventType, j as WebhookEvent, U as UserEventData, M as MembershipEventData, L as LicenseEventData, P as Permission, E as EntityRole } from './types-9KxXXUK5.mjs';

/**
 * OAuth client for AppHub authentication
 */
declare class AppHubOAuth {
    private config;
    private tokenEndpoint;
    private authorizationEndpoint;
    private userInfoEndpoint;
    constructor(config: AppHubConfig);
    /**
     * Generate PKCE code verifier
     */
    generateCodeVerifier(): string;
    /**
     * Generate PKCE code challenge from verifier
     */
    generateCodeChallenge(verifier: string): Promise<string>;
    /**
     * Generate a random state parameter for CSRF protection
     */
    generateState(): string;
    /**
     * Create authorization URL with all required parameters
     */
    createAuthorizationUrl(options?: {
        state?: string;
        codeVerifier?: string;
        scopes?: string[];
        redirectUri?: string;
    }): Promise<AuthorizationParams>;
    /**
     * Exchange authorization code for tokens
     */
    exchangeCode(code: string, codeVerifier: string, redirectUri?: string): Promise<TokenResponse>;
    /**
     * Refresh access token using refresh token
     */
    refreshToken(refreshToken: string): Promise<TokenResponse>;
    /**
     * Fetch user info from AppHub
     */
    getUserInfo(accessToken: string): Promise<Record<string, unknown>>;
    /**
     * Revoke a token (access or refresh)
     */
    revokeToken(token: string, tokenType?: 'access_token' | 'refresh_token'): Promise<void>;
}
/**
 * OAuth-specific error class
 */
declare class AppHubOAuthError extends Error {
    code: string;
    constructor(code: string, message: string);
}
/**
 * Create an OAuth client instance
 */
declare function createOAuthClient(config: AppHubConfig): AppHubOAuth;

/**
 * JWT validation options
 */
interface JWTValidationOptions {
    /** Skip audience validation */
    skipAudienceCheck?: boolean;
    /** Skip license check */
    skipLicenseCheck?: boolean;
    /** Additional required claims */
    requiredClaims?: string[];
}
/**
 * JWT validation result
 */
interface JWTValidationResult {
    valid: boolean;
    payload?: AppHubTokenPayload;
    error?: string;
}
/**
 * JWT Validator for AppHub tokens
 */
declare class AppHubJWT {
    private config;
    private publicKey;
    private jwksUrl;
    constructor(config: AppHubConfig);
    /**
     * Initialize the validator with the public key
     * Call this once at startup for better performance
     */
    initialize(): Promise<void>;
    /**
     * Get the public key for JWT verification
     */
    private getPublicKey;
    /**
     * Validate a JWT access token
     */
    validateToken(token: string, options?: JWTValidationOptions): Promise<JWTValidationResult>;
    /**
     * Validate and extract tenant context from token
     */
    getTenantContext(token: string, options?: JWTValidationOptions): Promise<TenantContext>;
    /**
     * Decode a token without verification (for debugging)
     * WARNING: Never trust unverified tokens for authorization
     */
    decodeToken(token: string): AppHubTokenPayload | null;
    /**
     * Check if a token is expired (without full validation)
     */
    isTokenExpired(token: string): boolean;
    /**
     * Get time until token expires in seconds
     * Returns negative value if already expired
     */
    getTokenExpiresIn(token: string): number;
}
/**
 * JWT-specific error class
 */
declare class AppHubJWTError extends Error {
    code: string;
    constructor(code: string, message: string);
}
/**
 * Create a JWT validator instance
 */
declare function createJWTValidator(config: AppHubConfig): AppHubJWT;
/**
 * Extract bearer token from Authorization header
 */
declare function extractBearerToken(authHeader: string | null | undefined): string | null;
/**
 * Extract bearer token from request
 * Works with both Request and IncomingMessage-like objects
 */
declare function extractTokenFromRequest(req: {
    headers: Headers | Record<string, string | string[] | undefined>;
}): string | null;

/**
 * API client for communicating with AppHub
 */
declare class AppHubApiClient {
    private config;
    private baseUrl;
    private serviceToken;
    constructor(config: AppHubConfig);
    /**
     * Set the service token for server-to-server API calls
     */
    setServiceToken(token: string): void;
    /**
     * Make an authenticated API request
     */
    private request;
    /**
     * Get current app information
     */
    getApp(token?: string): Promise<App>;
    /**
     * Sync permissions with AppHub
     * This registers or updates all permissions for your app
     */
    syncPermissions(permissions: PermissionDefinition[], token?: string): Promise<{
        created: number;
        updated: number;
        deleted: number;
        total: number;
    }>;
    /**
     * Get current permissions registered for the app
     */
    getPermissions(token?: string): Promise<PermissionDefinition[]>;
    /**
     * Sync scope types with AppHub
     */
    syncScopeTypes(scopeTypes: ScopeTypeDefinition[], token?: string): Promise<{
        created: number;
        updated: number;
        deleted: number;
        total: number;
    }>;
    /**
     * Get current scope types registered for the app
     */
    getScopeTypes(token?: string): Promise<ScopeTypeDefinition[]>;
    /**
     * Get available plans for the app
     */
    getPlans(token?: string): Promise<Plan[]>;
    /**
     * Get license for a specific entity
     */
    getLicense(entityId: string, token?: string): Promise<License | null>;
    /**
     * Check if an entity is licensed for this app
     */
    isLicensed(entityId: string, token?: string): Promise<boolean>;
    /**
     * Provide scope options for AppHub to display
     * AppHub will call your optionsEndpoint and proxy through this
     */
    getScopeOptions(scopeType: string, entityId: string, token?: string): Promise<ScopeOption[]>;
    /**
     * Get entity information
     */
    getEntity(entityId: string, token?: string): Promise<{
        id: string;
        name: string;
        slug: string;
        logo?: string;
        parentId?: string;
    }>;
    /**
     * Get entity members with their roles and permissions for this app
     */
    getEntityMembers(entityId: string, token?: string): Promise<Array<{
        userId: string;
        email: string;
        name: string;
        role: string;
        permissions: string[];
        scope?: {
            type: string;
            value: unknown;
        };
    }>>;
    /**
     * Test webhook connectivity (sends a test event)
     */
    testWebhook(webhookId: string, token?: string): Promise<{
        success: boolean;
        statusCode: number;
        responseTime: number;
    }>;
    /**
     * Health check for AppHub connectivity
     */
    healthCheck(): Promise<boolean>;
    /**
     * Get AppHub public key for JWT verification
     */
    getPublicKey(): Promise<string>;
}
/**
 * API-specific error class
 */
declare class AppHubApiError extends Error {
    code: string;
    statusCode: number;
    details?: Record<string, unknown>;
    constructor(code: string, message: string, statusCode: number, details?: Record<string, unknown>);
    /**
     * Check if error is a not found error
     */
    isNotFound(): boolean;
    /**
     * Check if error is an authorization error
     */
    isUnauthorized(): boolean;
    /**
     * Check if error is a forbidden error
     */
    isForbidden(): boolean;
}
/**
 * Create an API client instance
 */
declare function createApiClient(config: AppHubConfig): AppHubApiClient;

/**
 * Webhook handler function type
 */
type WebhookHandler<T = any> = (event: WebhookEvent<T>) => Promise<void> | void;
/**
 * Map of event types to their handlers
 */
type WebhookHandlerMap = Partial<Record<WebhookEventType, WebhookHandler>>;
/**
 * Verify webhook signature from AppHub
 */
declare function verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean>;
/**
 * Parse and validate a webhook request
 */
declare function parseWebhookRequest<T = Record<string, unknown>>(payload: string, signature: string, secret: string): Promise<WebhookEvent<T>>;
/**
 * Webhook error class
 */
declare class WebhookError extends Error {
    code: string;
    constructor(code: string, message: string);
}
/**
 * Webhook processor for handling multiple event types
 */
declare class WebhookProcessor {
    private secret;
    private handlers;
    private defaultHandler?;
    constructor(secret: string);
    /**
     * Register a handler for a specific event type
     */
    on(eventType: WebhookEventType, handler: WebhookHandler): this;
    /**
     * Register a default handler for unhandled events
     */
    onDefault(handler: WebhookHandler): this;
    /**
     * Register handlers for user events
     */
    onUserCreated(handler: WebhookHandler<UserEventData>): this;
    onUserUpdated(handler: WebhookHandler<UserEventData>): this;
    onUserDeleted(handler: WebhookHandler<UserEventData>): this;
    /**
     * Register handlers for membership events
     */
    onMembershipCreated(handler: WebhookHandler<MembershipEventData>): this;
    onMembershipUpdated(handler: WebhookHandler<MembershipEventData>): this;
    onMembershipDeleted(handler: WebhookHandler<MembershipEventData>): this;
    /**
     * Register handlers for license events
     */
    onLicenseActivated(handler: WebhookHandler<LicenseEventData>): this;
    onLicenseSuspended(handler: WebhookHandler<LicenseEventData>): this;
    onLicenseCancelled(handler: WebhookHandler<LicenseEventData>): this;
    /**
     * Process a webhook request
     */
    process(payload: string, signature: string): Promise<WebhookEvent>;
    /**
     * Create a request handler for common frameworks
     */
    createHandler(): (req: {
        text?: () => Promise<string>;
        body?: string | Record<string, unknown>;
        headers: Headers | Record<string, string | string[] | undefined>;
    }) => Promise<{
        success: boolean;
        event?: WebhookEvent;
        error?: string;
    }>;
}
/**
 * Create a webhook processor
 */
declare function createWebhookProcessor(secret: string): WebhookProcessor;
/**
 * Options for creating a Next.js webhook handler
 */
interface NextJSWebhookOptions {
    secret: string;
    handlers: WebhookHandlerMap;
    onError?: (error: Error) => void;
}
/**
 * Create a Next.js API route handler for webhooks
 * For use in app/api/webhooks/apphub/route.ts
 */
declare function createNextJSWebhookHandler(options: NextJSWebhookOptions): (request: Request) => Promise<Response>;

/**
 * Check if a user has a specific permission
 */
declare function hasPermission(ctx: TenantContext, permission: Permission): boolean;
/**
 * Check if a user has ALL of the specified permissions
 */
declare function hasAllPermissions(ctx: TenantContext, permissions: Permission[]): boolean;
/**
 * Check if a user has ANY of the specified permissions
 */
declare function hasAnyPermission(ctx: TenantContext, permissions: Permission[]): boolean;
/**
 * Check if a user has at least the specified role level
 */
declare function hasRole(ctx: TenantContext, minimumRole: EntityRole): boolean;
/**
 * Check if user has exact role (no hierarchy)
 */
declare function hasExactRole(ctx: TenantContext, role: EntityRole): boolean;
/**
 * Check if user is entity owner
 */
declare function isOwner(ctx: TenantContext): boolean;
/**
 * Check if user is admin or owner
 */
declare function isAdmin(ctx: TenantContext): boolean;
/**
 * Check if user is currently being impersonated
 */
declare function isImpersonated(ctx: TenantContext): boolean;
/**
 * Parse a permission string into resource and action
 */
declare function parsePermission(permission: Permission): {
    resource: string;
    action: string;
};
/**
 * Build a permission string from resource and action
 */
declare function buildPermission(resource: string, action: string): Permission;
/**
 * Get all permissions for a specific resource
 */
declare function getPermissionsForResource(ctx: TenantContext, resource: string): Permission[];
/**
 * Check if user can perform an action on a resource
 */
declare function canPerform(ctx: TenantContext, resource: string, action: string): boolean;
/**
 * Check if user can read a resource
 */
declare function canRead(ctx: TenantContext, resource: string): boolean;
/**
 * Check if user can write to a resource
 */
declare function canWrite(ctx: TenantContext, resource: string): boolean;
/**
 * Check if user can delete a resource
 */
declare function canDelete(ctx: TenantContext, resource: string): boolean;
/**
 * Check if user can manage a resource (full control)
 */
declare function canManage(ctx: TenantContext, resource: string): boolean;
/**
 * Authorization error for guard functions
 */
declare class AuthorizationError extends Error {
    code: string;
    requiredPermission?: Permission;
    requiredRole?: EntityRole;
    constructor(message: string, options?: {
        permission?: Permission;
        role?: EntityRole;
    });
}
/**
 * Guard that throws if permission is missing
 */
declare function requirePermission(ctx: TenantContext, permission: Permission): void;
/**
 * Guard that throws if any permission is missing
 */
declare function requireAllPermissions(ctx: TenantContext, permissions: Permission[]): void;
/**
 * Guard that throws if user doesn't have at least one of the permissions
 */
declare function requireAnyPermission(ctx: TenantContext, permissions: Permission[]): void;
/**
 * Guard that throws if user doesn't have minimum role
 */
declare function requireRole(ctx: TenantContext, minimumRole: EntityRole): void;
/**
 * Guard that throws if user is not admin
 */
declare function requireAdmin(ctx: TenantContext): void;
/**
 * Guard that throws if user is not owner
 */
declare function requireOwner(ctx: TenantContext): void;
/**
 * Create a permission definition
 */
declare function definePermission(resource: string, action: string, options: Omit<PermissionDefinition, 'slug' | 'resource' | 'action'>): PermissionDefinition;
/**
 * Define a standard CRUD permission set for a resource
 */
declare function defineCrudPermissions(resource: string, displayName: string, options?: {
    groupName?: string;
    defaultActions?: ('read' | 'write' | 'delete')[];
    includeManage?: boolean;
    includeExport?: boolean;
}): PermissionDefinition[];
/**
 * Method decorator to require permission
 * Usage: @RequirePermission('vehicles:read')
 */
declare function RequirePermission(permission: Permission): (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Method decorator to require minimum role
 * Usage: @RequireRole('admin')
 */
declare function RequireRole(minimumRole: EntityRole): (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;

/**
 * Configuration for mapping scope types to database fields
 */
interface ScopeFilterConfig {
    /** Field name for single customer scope */
    customer?: string;
    /** Field name for multiple customers scope */
    customers?: string;
    /** Field name for region scope */
    region?: string;
    /** Field name for entity IDs scope */
    entityIds?: string;
    /** Field name for entity ID (required for all queries) */
    entityId?: string;
    /** Custom field mappings for app-specific scopes */
    custom?: Record<string, string>;
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
declare function applyScopeFilter<T extends Record<string, unknown>>(where: T, ctx: TenantContext, config?: ScopeFilterConfig): T;
/**
 * Create a scope filter function with pre-configured field mappings
 */
declare function createScopeFilter(config: ScopeFilterConfig): <T extends Record<string, unknown>>(where: T, ctx: TenantContext) => T;
/**
 * Check if a user has access to a specific record based on scope
 */
declare function hasAccessToRecord(record: Record<string, unknown>, ctx: TenantContext, config?: ScopeFilterConfig): boolean;
/**
 * Filter an array of records based on scope
 */
declare function filterRecordsByScope<T extends Record<string, unknown>>(records: T[], ctx: TenantContext, config?: ScopeFilterConfig): T[];
/**
 * Guard function that throws if user doesn't have access to record
 */
declare function requireAccessToRecord(record: Record<string, unknown>, ctx: TenantContext, config?: ScopeFilterConfig): void;
/**
 * Scope access error class
 */
declare class ScopeAccessError extends Error {
    code: string;
    constructor(message: string);
}
/**
 * Define a full access scope type (no restrictions)
 */
declare function defineFullAccessScope(): ScopeTypeDefinition;
/**
 * Define a customer scope type
 */
declare function defineCustomerScope(options?: {
    name?: string;
    description?: string;
    multiSelect?: boolean;
    optionsEndpoint?: string;
}): ScopeTypeDefinition;
/**
 * Define a region scope type
 */
declare function defineRegionScope(options?: {
    name?: string;
    description?: string;
    optionsEndpoint?: string;
}): ScopeTypeDefinition;
/**
 * Define a custom scope type
 */
declare function defineCustomScope(slug: string, options: Omit<ScopeTypeDefinition, 'slug'>): ScopeTypeDefinition;
/**
 * Get scope type from context
 */
declare function getScopeType(ctx: TenantContext): string | null;
/**
 * Get scope value from context
 */
declare function getScopeValue<T = Record<string, unknown>>(ctx: TenantContext): T | null;
/**
 * Check if context has full access (no scope restrictions)
 */
declare function hasFullAccess(ctx: TenantContext): boolean;
/**
 * Check if context has a specific scope type
 */
declare function hasScopeType(ctx: TenantContext, scopeType: string): boolean;
/**
 * Build scope options response for AppHub
 */
interface ScopeOptionItem {
    id: string;
    name: string;
    meta?: Record<string, unknown>;
}
declare function buildScopeOptionsResponse(items: ScopeOptionItem[]): {
    data: ScopeOptionItem[];
};

export { buildScopeOptionsResponse as $, AppHubOAuth as A, requireAllPermissions as B, requireAnyPermission as C, requireRole as D, requireAdmin as E, requireOwner as F, AuthorizationError as G, definePermission as H, defineCrudPermissions as I, type JWTValidationOptions as J, RequireRole as K, applyScopeFilter as L, createScopeFilter as M, hasAccessToRecord as N, filterRecordsByScope as O, requireAccessToRecord as P, defineFullAccessScope as Q, RequirePermission as R, ScopeAccessError as S, defineCustomerScope as T, defineRegionScope as U, defineCustomScope as V, WebhookProcessor as W, getScopeType as X, getScopeValue as Y, hasFullAccess as Z, hasScopeType as _, AppHubJWT as a, type ScopeFilterConfig as a0, type ScopeOptionItem as a1, verifyWebhookSignature as a2, parseWebhookRequest as a3, WebhookError as a4, createWebhookProcessor as a5, createNextJSWebhookHandler as a6, type WebhookHandler as a7, type WebhookHandlerMap as a8, type NextJSWebhookOptions as a9, AppHubApiError as aa, createApiClient as ab, AppHubApiClient as b, AppHubOAuthError as c, createOAuthClient as d, AppHubJWTError as e, createJWTValidator as f, extractBearerToken as g, extractTokenFromRequest as h, type JWTValidationResult as i, hasPermission as j, hasAllPermissions as k, hasAnyPermission as l, hasRole as m, hasExactRole as n, isOwner as o, isAdmin as p, isImpersonated as q, parsePermission as r, buildPermission as s, getPermissionsForResource as t, canPerform as u, canRead as v, canWrite as w, canDelete as x, canManage as y, requirePermission as z };
