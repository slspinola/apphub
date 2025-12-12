import { A as AppHubConfig, E as EntityRole, P as Permission, T as TenantContext } from '../types-9KxXXUK5.mjs';
import { a0 as ScopeFilterConfig } from '../scope-vGY4BFwn.mjs';
export { aa as AppHubApiError, a as AppHubJWT, c as AppHubOAuthError, G as AuthorizationError, S as ScopeAccessError, a4 as WebhookError, L as applyScopeFilter, ab as createApiClient, a6 as createNextJSWebhookHandler, d as createOAuthClient, a5 as createWebhookProcessor, N as hasAccessToRecord, k as hasAllPermissions, l as hasAnyPermission, Z as hasFullAccess, j as hasPermission, m as hasRole, p as isAdmin, o as isOwner, E as requireAdmin, F as requireOwner, z as requirePermission, D as requireRole } from '../scope-vGY4BFwn.mjs';

/**
 * Next.js specific configuration
 */
interface NextJSConfig extends AppHubConfig {
    /** Login page path */
    loginPath?: string;
    /** Path after successful login */
    callbackPath?: string;
    /** Paths that don't require authentication */
    publicPaths?: string[];
}
/**
 * Create NextAuth.js provider configuration for AppHub
 *
 * Usage in auth.ts:
 * ```ts
 * import { createAppHubProvider } from '@apphub/sdk/nextjs'
 *
 * export const { handlers, auth, signIn, signOut } = NextAuth({
 *   providers: [
 *     createAppHubProvider({
 *       hubUrl: process.env.APPHUB_URL!,
 *       clientId: process.env.APPHUB_CLIENT_ID!,
 *       clientSecret: process.env.APPHUB_CLIENT_SECRET!,
 *       appSlug: 'myapp',
 *     })
 *   ]
 * })
 * ```
 */
declare function createAppHubProvider(config: AppHubConfig): {
    id: string;
    name: string;
    type: "oidc";
    issuer: string;
    clientId: string;
    clientSecret: string;
    authorization: {
        params: {
            scope: string;
        };
    };
    profile(profile: Record<string, unknown>): {
        id: string;
        name: string;
        email: string;
        image: string | null;
        entityId: string;
        entityName: string;
        entitySlug: string;
        role: EntityRole;
        permissions: Permission[];
        scopes: Record<string, unknown>;
        licensedApps: string[];
    };
};
/**
 * NextAuth.js callbacks configuration for AppHub
 *
 * Usage:
 * ```ts
 * export const { handlers, auth } = NextAuth({
 *   providers: [...],
 *   callbacks: createAppHubCallbacks('myapp')
 * })
 * ```
 */
declare function createAppHubCallbacks(appSlug: string): {
    jwt({ token, account, profile }: {
        token: Record<string, unknown>;
        account?: {
            access_token?: string;
            refresh_token?: string;
        };
        profile?: Record<string, unknown>;
    }): Promise<Record<string, unknown>>;
    session({ session, token }: {
        session: {
            user: Record<string, unknown>;
            accessToken?: string;
        };
        token: Record<string, unknown>;
    }): Promise<{
        user: Record<string, unknown>;
        accessToken?: string;
    }>;
};
/**
 * Create a protected API route handler
 * Validates JWT and extracts tenant context
 */
declare function createProtectedHandler<T>(config: AppHubConfig, handler: (ctx: TenantContext, request: Request) => Promise<Response>): (request: Request) => Promise<Response>;
/**
 * Create a protected handler with permission check
 */
declare function createPermissionHandler<T>(config: AppHubConfig, permission: Permission, handler: (ctx: TenantContext, request: Request) => Promise<Response>): (request: Request) => Promise<Response>;
/**
 * Create a protected handler with role check
 */
declare function createRoleHandler(config: AppHubConfig, minimumRole: EntityRole, handler: (ctx: TenantContext, request: Request) => Promise<Response>): (request: Request) => Promise<Response>;
/**
 * Check if a path is public (doesn't require authentication)
 */
declare function isPublicPath(pathname: string, publicPaths?: string[]): boolean;
/**
 * Create middleware config for protected routes
 */
declare function createMiddlewareConfig(publicPaths?: string[]): {
    matcher: string[];
    publicPaths: string[];
};
/**
 * Helper to get tenant context in server components
 * Use with NextAuth.js auth() function
 */
declare function getTenantContextFromSession(session: {
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
        scope?: {
            type: string;
            value: unknown;
        };
    };
} | null): TenantContext | null;
/**
 * Create a Prisma-compatible where clause with entity and scope filters
 */
declare function createSecureWhere<T extends Record<string, unknown>>(ctx: TenantContext, where?: T, scopeConfig?: ScopeFilterConfig): T;

export { AppHubConfig, type NextJSConfig, TenantContext, createAppHubCallbacks, createAppHubProvider, createMiddlewareConfig, createPermissionHandler, createProtectedHandler, createRoleHandler, createSecureWhere, getTenantContextFromSession, isPublicPath };
