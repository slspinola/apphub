// ============================================================================
// APPHUB SDK - Next.js Integration
// ============================================================================

import type {
  AppHubConfig,
  TenantContext,
  Permission,
  EntityRole,
} from '../types'
import { AppHubJWT, extractTokenFromRequest } from '../jwt'
import { hasPermission, hasRole, AuthorizationError } from '../rbac'
import { applyScopeFilter, type ScopeFilterConfig } from '../scope'

export type { AppHubConfig, TenantContext }

/**
 * Next.js specific configuration
 */
export interface NextJSConfig extends AppHubConfig {
  /** Login page path */
  loginPath?: string
  /** Path after successful login */
  callbackPath?: string
  /** Paths that don't require authentication */
  publicPaths?: string[]
}

// ============================================================================
// NEXTAUTH.JS PROVIDER CONFIGURATION
// ============================================================================

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
export function createAppHubProvider(config: AppHubConfig) {
  const baseUrl = config.hubUrl.replace(/\/$/, '')
  
  return {
    id: 'apphub',
    name: 'AppHub',
    type: 'oidc' as const,
    issuer: baseUrl,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    authorization: {
      params: { scope: 'openid profile email organization' }
    },
    profile(profile: Record<string, unknown>) {
      return {
        id: profile.sub as string,
        name: profile.name as string,
        email: profile.email as string,
        image: profile.image as string | null,
        // Extended AppHub profile
        entityId: profile.entity_id as string,
        entityName: profile.entity_name as string,
        entitySlug: profile.entity_slug as string,
        role: profile.role as EntityRole,
        permissions: profile.permissions as Permission[],
        scopes: profile.scopes as Record<string, unknown>,
        licensedApps: profile.licensed_apps as string[],
      }
    },
  }
}

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
export function createAppHubCallbacks(appSlug: string) {
  return {
    async jwt({ token, account, profile }: {
      token: Record<string, unknown>
      account?: { access_token?: string; refresh_token?: string }
      profile?: Record<string, unknown>
    }) {
      if (account && profile) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.entityId = profile.entity_id
        token.entityName = profile.entity_name
        token.entitySlug = profile.entity_slug
        token.role = profile.role
        token.permissions = profile.permissions
        token.scopes = profile.scopes
        token.licensedApps = profile.licensed_apps
      }
      return token
    },
    async session({ session, token }: {
      session: { user: Record<string, unknown>; accessToken?: string }
      token: Record<string, unknown>
    }) {
      if (token && session.user) {
        session.accessToken = token.accessToken as string
        session.user.entityId = token.entityId as string
        session.user.entityName = token.entityName as string
        session.user.entitySlug = token.entitySlug as string
        session.user.role = token.role as EntityRole
        session.user.permissions = token.permissions as Permission[]
        session.user.scopes = token.scopes as Record<string, unknown>
        session.user.scope = (token.scopes as Record<string, unknown>)?.[appSlug]
      }
      return session
    },
  }
}

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * Create a protected API route handler
 * Validates JWT and extracts tenant context
 */
export function createProtectedHandler<T>(
  config: AppHubConfig,
  handler: (ctx: TenantContext, request: Request) => Promise<Response>
): (request: Request) => Promise<Response> {
  const jwt = new AppHubJWT(config)

  return async (request: Request): Promise<Response> => {
    try {
      const token = extractTokenFromRequest(request)
      if (!token) {
        return Response.json(
          { error: 'Missing authorization token' },
          { status: 401 }
        )
      }

      const ctx = await jwt.getTenantContext(token)
      return handler(ctx, request)
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return Response.json(
          { error: error.message },
          { status: 403 }
        )
      }
      return Response.json(
        { error: error instanceof Error ? error.message : 'Authentication failed' },
        { status: 401 }
      )
    }
  }
}

/**
 * Create a protected handler with permission check
 */
export function createPermissionHandler<T>(
  config: AppHubConfig,
  permission: Permission,
  handler: (ctx: TenantContext, request: Request) => Promise<Response>
): (request: Request) => Promise<Response> {
  return createProtectedHandler(config, async (ctx, request) => {
    if (!hasPermission(ctx, permission)) {
      return Response.json(
        { error: `Missing required permission: ${permission}` },
        { status: 403 }
      )
    }
    return handler(ctx, request)
  })
}

/**
 * Create a protected handler with role check
 */
export function createRoleHandler(
  config: AppHubConfig,
  minimumRole: EntityRole,
  handler: (ctx: TenantContext, request: Request) => Promise<Response>
): (request: Request) => Promise<Response> {
  return createProtectedHandler(config, async (ctx, request) => {
    if (!hasRole(ctx, minimumRole)) {
      return Response.json(
        { error: `Requires role: ${minimumRole} or higher` },
        { status: 403 }
      )
    }
    return handler(ctx, request)
  })
}

// ============================================================================
// MIDDLEWARE UTILITIES
// ============================================================================

/**
 * Check if a path is public (doesn't require authentication)
 */
export function isPublicPath(pathname: string, publicPaths: string[] = []): boolean {
  const defaultPublicPaths = [
    '/login',
    '/register',
    '/api/auth',
    '/api/webhooks',
    '/_next',
    '/favicon.ico',
  ]
  
  const allPublicPaths = [...defaultPublicPaths, ...publicPaths]
  
  return allPublicPaths.some(path => {
    if (path.endsWith('*')) {
      return pathname.startsWith(path.slice(0, -1))
    }
    return pathname === path || pathname.startsWith(`${path}/`)
  })
}

/**
 * Create middleware config for protected routes
 */
export function createMiddlewareConfig(publicPaths: string[] = []) {
  return {
    matcher: [
      '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
    publicPaths: [
      '/login',
      '/register',
      '/api/auth',
      '/api/webhooks',
      ...publicPaths,
    ],
  }
}

// ============================================================================
// SERVER COMPONENTS UTILITIES
// ============================================================================

/**
 * Helper to get tenant context in server components
 * Use with NextAuth.js auth() function
 */
export function getTenantContextFromSession(session: {
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
    scope?: { type: string; value: unknown }
  }
} | null): TenantContext | null {
  if (!session?.user?.entityId) {
    return null
  }

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
    scope: user.scope as TenantContext['scope'],
    isImpersonated: false,
    impersonatedBy: null,
    licensedApps: [],
    tokenPayload: {} as TenantContext['tokenPayload'],
  }
}

// ============================================================================
// DATABASE QUERY HELPERS
// ============================================================================

/**
 * Create a Prisma-compatible where clause with entity and scope filters
 */
export function createSecureWhere<T extends Record<string, unknown>>(
  ctx: TenantContext,
  where: T = {} as T,
  scopeConfig: ScopeFilterConfig = {}
): T {
  return applyScopeFilter(where, ctx, scopeConfig)
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export { AppHubOAuthError, createOAuthClient } from '../oauth'
export { AppHubJWT } from '../jwt'

export {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  hasRole,
  isOwner,
  isAdmin,
  requirePermission,
  requireRole,
  requireAdmin,
  requireOwner,
  AuthorizationError,
} from '../rbac'

export {
  applyScopeFilter,
  hasAccessToRecord,
  hasFullAccess,
  ScopeAccessError,
} from '../scope'

export { createApiClient, AppHubApiError } from '../api'
export { createWebhookProcessor, createNextJSWebhookHandler, WebhookError } from '../webhook'

