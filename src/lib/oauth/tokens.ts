// ============================================================================
// OAuth Provider - Token Generation Utilities
// ============================================================================

import { prisma } from '@/lib/prisma'
import { signAccessToken, signIdToken, AccessTokenClaims, IdTokenClaims } from './jwt'
import { generateAuthorizationCode, generateRefreshToken, verifyCodeChallenge } from './pkce'

// Types
export interface AuthorizationCodeParams {
  clientId: string
  userId: string
  redirectUri: string
  scope: string
  codeChallenge?: string
  codeChallengeMethod?: string
  nonce?: string
}

export interface TokenResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  refresh_token: string
  id_token?: string
  scope: string
}

export interface UserTokenData {
  userId: string
  email: string
  name: string | null
  image?: string | null
  entityId: string
  entityName: string
  entitySlug: string
  role: string
  permissions: string[]
  scopes?: Record<string, { type: string; value: unknown }>
  licensedApps: string[]
  impersonatedBy?: { id: string; email: string; role: string } | null
}

// ============================================================================
// Authorization Code Management
// ============================================================================

/**
 * Create an authorization code for the OAuth flow
 */
export async function createAuthorizationCode(params: AuthorizationCodeParams): Promise<string> {
  const code = generateAuthorizationCode()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  await prisma.oAuthAuthorizationCode.create({
    data: {
      code,
      clientId: params.clientId,
      userId: params.userId,
      redirectUri: params.redirectUri,
      scope: params.scope,
      codeChallenge: params.codeChallenge || null,
      codeChallengeMethod: params.codeChallengeMethod || null,
      nonce: params.nonce || null,
      expiresAt,
    },
  })

  return code
}

/**
 * Validate and consume an authorization code
 */
export async function validateAuthorizationCode(
  code: string,
  clientId: string,
  redirectUri: string,
  codeVerifier?: string
): Promise<{ userId: string; scope: string } | null> {
  const authCode = await prisma.oAuthAuthorizationCode.findUnique({
    where: { code },
  })

  // Check if code exists
  if (!authCode) {
    return null
  }

  // Check if code is expired
  if (authCode.expiresAt < new Date()) {
    await prisma.oAuthAuthorizationCode.delete({ where: { id: authCode.id } })
    return null
  }

  // Check if code was already used
  if (authCode.usedAt) {
    // Potential replay attack - revoke all tokens for this authorization
    await prisma.oAuthRefreshToken.updateMany({
      where: { clientId: authCode.clientId, userId: authCode.userId },
      data: { revokedAt: new Date() },
    })
    return null
  }

  // Check client ID matches
  if (authCode.clientId !== clientId) {
    return null
  }

  // Check redirect URI matches
  if (authCode.redirectUri !== redirectUri) {
    return null
  }

  // Validate PKCE if code challenge was provided
  if (authCode.codeChallenge) {
    if (!codeVerifier) {
      return null
    }
    if (!verifyCodeChallenge(codeVerifier, authCode.codeChallenge, authCode.codeChallengeMethod || 'S256')) {
      return null
    }
  }

  // Mark code as used
  await prisma.oAuthAuthorizationCode.update({
    where: { id: authCode.id },
    data: { usedAt: new Date() },
  })

  return {
    userId: authCode.userId,
    scope: authCode.scope,
  }
}

// ============================================================================
// Authorization Code Consumption (for token endpoint)
// ============================================================================

/**
 * Consume an authorization code and return its data
 * This marks the code as used and returns all stored data
 */
export async function consumeAuthorizationCode(code: string) {
  const authCode = await prisma.oAuthAuthorizationCode.findUnique({
    where: { code },
  })

  if (!authCode) {
    return null
  }

  // Check if code is expired
  if (authCode.expiresAt < new Date()) {
    await prisma.oAuthAuthorizationCode.delete({ where: { id: authCode.id } })
    return null
  }

  // Check if code was already used (replay attack detection)
  if (authCode.usedAt) {
    // Revoke all tokens issued with this code
    await prisma.oAuthRefreshToken.updateMany({
      where: { clientId: authCode.clientId, userId: authCode.userId },
      data: { revokedAt: new Date() },
    })
    return null
  }

  // Mark code as used
  await prisma.oAuthAuthorizationCode.update({
    where: { id: authCode.id },
    data: { usedAt: new Date() },
  })

  return authCode
}

// ============================================================================
// Refresh Token Validation (for token endpoint)
// ============================================================================

/**
 * Validate a refresh token and return its data
 */
export async function validateRefreshToken(token: string) {
  const refreshToken = await prisma.oAuthRefreshToken.findUnique({
    where: { token },
  })

  if (!refreshToken) {
    return null
  }

  // Check if token is revoked
  if (refreshToken.revokedAt) {
    return null
  }

  // Check if token is expired
  if (refreshToken.expiresAt < new Date()) {
    return null
  }

  // Revoke the token after use (refresh token rotation)
  await prisma.oAuthRefreshToken.update({
    where: { id: refreshToken.id },
    data: { revokedAt: new Date() },
  })

  return refreshToken
}

// ============================================================================
// Token Response Generation (for token endpoint)
// ============================================================================

interface GenerateTokenResponseParams {
  user: { id: string; email: string; name: string | null; image: string | null }
  membership: { role: string; entity: { id: string; name: string; slug: string } }
  client: { clientId: string; tokenLifetime: number; refreshTokenLifetime: number; app?: { slug: string } }
  scope: string
  permissions: string[]
  licensedApps: string[]
  scopes?: Record<string, { type: string; value: unknown }>
  impersonatedBy?: { id: string; email: string; role: string } | null
  nonce?: string | null
}

/**
 * Generate a complete token response for the token endpoint
 */
export async function generateTokenResponse(params: GenerateTokenResponseParams): Promise<TokenResponse> {
  const { user, membership, client, scope, permissions, licensedApps, scopes, impersonatedBy, nonce } = params

  // Get app info if not included
  let appSlug = client.app?.slug
  if (!appSlug) {
    const fullClient = await prisma.oAuthClient.findUnique({
      where: { clientId: client.clientId },
      include: { app: true },
    })
    appSlug = fullClient?.app.slug || 'unknown'
  }

  const accessTokenExpiry = client.tokenLifetime || 3600
  const refreshTokenExpiry = client.refreshTokenLifetime || 604800

  // Build access token claims
  const accessTokenClaims: Omit<AccessTokenClaims, 'iss' | 'exp' | 'iat' | 'jti'> = {
    sub: user.id,
    aud: [appSlug],
    azp: client.clientId,
    scope,
    email: user.email,
    name: user.name,
    image: user.image,
    entity_id: membership.entity.id,
    entity_name: membership.entity.name,
    entity_slug: membership.entity.slug,
    role: membership.role,
    permissions,
    scopes,
    licensed_apps: licensedApps,
    impersonated_by: impersonatedBy || null,
  }

  // Sign access token
  const accessToken = await signAccessToken(accessTokenClaims, accessTokenExpiry)

  // Generate and store refresh token
  const refreshTokenValue = generateRefreshToken()
  const refreshTokenExpiresAt = new Date(Date.now() + refreshTokenExpiry * 1000)

  await prisma.oAuthRefreshToken.create({
    data: {
      token: refreshTokenValue,
      clientId: client.clientId,
      userId: user.id,
      scope,
      expiresAt: refreshTokenExpiresAt,
    },
  })

  // Build response
  const response: TokenResponse = {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: accessTokenExpiry,
    refresh_token: refreshTokenValue,
    scope,
  }

  // Generate ID token if scope includes openid
  if (scope.includes('openid')) {
    const idTokenClaims: Omit<IdTokenClaims, 'iss' | 'exp' | 'iat'> = {
      sub: user.id,
      aud: client.clientId,
      email: user.email,
      email_verified: true,
      name: user.name || undefined,
      picture: user.image || undefined,
      entity_id: membership.entity.id,
      entity_name: membership.entity.name,
      entity_slug: membership.entity.slug,
      role: membership.role,
      nonce: nonce || undefined,
    }

    response.id_token = await signIdToken(idTokenClaims, accessTokenExpiry)
  }

  return response
}

/**
 * Create a new refresh token in the database
 */
export async function createRefreshToken(
  clientId: string,
  userId: string,
  scope: string,
  expiresInSeconds: number = 604800
): Promise<string> {
  const tokenValue = generateRefreshToken()
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000)

  await prisma.oAuthRefreshToken.create({
    data: {
      token: tokenValue,
      clientId,
      userId,
      scope,
      expiresAt,
    },
  })

  return tokenValue
}

// ============================================================================
// Token Generation (Legacy - for backward compatibility)
// ============================================================================

/**
 * Generate complete token response for a user
 */
export async function generateTokens(
  clientId: string,
  userData: UserTokenData,
  scope: string,
  includeIdToken: boolean = true
): Promise<TokenResponse> {
  // Get client configuration
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId },
    include: { app: true },
  })

  if (!client) {
    throw new Error('Invalid client')
  }

  const accessTokenExpiry = client.tokenLifetime || 3600
  const refreshTokenExpiry = client.refreshTokenLifetime || 604800

  // Build access token claims
  const accessTokenClaims: Omit<AccessTokenClaims, 'iss' | 'exp' | 'iat' | 'jti'> = {
    sub: userData.userId,
    aud: [client.app.slug],
    azp: clientId,
    scope,
    email: userData.email,
    name: userData.name,
    image: userData.image,
    entity_id: userData.entityId,
    entity_name: userData.entityName,
    entity_slug: userData.entitySlug,
    role: userData.role,
    permissions: userData.permissions,
    scopes: userData.scopes,
    licensed_apps: userData.licensedApps,
    impersonated_by: userData.impersonatedBy,
  }

  // Sign access token
  const accessToken = await signAccessToken(accessTokenClaims, accessTokenExpiry)

  // Generate and store refresh token
  const refreshTokenValue = generateRefreshToken()
  const refreshTokenExpiresAt = new Date(Date.now() + refreshTokenExpiry * 1000)

  await prisma.oAuthRefreshToken.create({
    data: {
      token: refreshTokenValue,
      clientId,
      userId: userData.userId,
      scope,
      expiresAt: refreshTokenExpiresAt,
    },
  })

  // Build response
  const response: TokenResponse = {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: accessTokenExpiry,
    refresh_token: refreshTokenValue,
    scope,
  }

  // Generate ID token if requested and scope includes openid
  if (includeIdToken && scope.includes('openid')) {
    const idTokenClaims: Omit<IdTokenClaims, 'iss' | 'exp' | 'iat'> = {
      sub: userData.userId,
      aud: clientId,
      email: userData.email,
      email_verified: true,
      name: userData.name || undefined,
      picture: userData.image || undefined,
      entity_id: userData.entityId,
      entity_name: userData.entityName,
      entity_slug: userData.entitySlug,
      role: userData.role,
    }

    response.id_token = await signIdToken(idTokenClaims, accessTokenExpiry)
  }

  return response
}

/**
 * Refresh tokens using a refresh token
 */
export async function refreshTokens(
  refreshToken: string,
  clientId: string
): Promise<TokenResponse | null> {
  // Find the refresh token
  const storedToken = await prisma.oAuthRefreshToken.findUnique({
    where: { token: refreshToken },
    include: {
      user: {
        include: {
          memberships: {
            include: {
              entity: {
                include: {
                  licenses: {
                    include: { app: true },
                  },
                },
              },
              scopes: true,
            },
          },
        },
      },
    },
  })

  // Validate token
  if (!storedToken) {
    return null
  }

  if (storedToken.clientId !== clientId) {
    return null
  }

  if (storedToken.revokedAt) {
    return null
  }

  if (storedToken.expiresAt < new Date()) {
    return null
  }

  // Get client and app info
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId },
    include: { app: true },
  })

  if (!client) {
    return null
  }

  // Find membership for the app's entity context (use first active membership)
  const membership = storedToken.user.memberships[0]
  if (!membership) {
    return null
  }

  // Get licensed apps for the entity
  const licensedApps = membership.entity.licenses
    .filter(l => l.status === 'ACTIVE')
    .map(l => l.app.slug)

  // Get permissions for the user (simplified - in production, fetch from permission assignments)
  const permissions: string[] = []

  // Get app-specific scope
  const appScope = membership.scopes.find(s => s.appId === client.app.id)
  const scopes: Record<string, { type: string; value: unknown }> = {}
  if (appScope) {
    scopes[client.app.slug] = {
      type: appScope.scopeType,
      value: appScope.scopeValue,
    }
  }

  // Build user data for token generation
  const userData: UserTokenData = {
    userId: storedToken.user.id,
    email: storedToken.user.email,
    name: storedToken.user.name,
    image: storedToken.user.image,
    entityId: membership.entity.id,
    entityName: membership.entity.name,
    entitySlug: membership.entity.slug,
    role: membership.role,
    permissions,
    scopes,
    licensedApps,
    impersonatedBy: null,
  }

  // Revoke old refresh token
  await prisma.oAuthRefreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() },
  })

  // Generate new tokens
  return generateTokens(clientId, userData, storedToken.scope, true)
}

// ============================================================================
// Token Revocation
// ============================================================================

/**
 * Revoke a refresh token (simplified - no client validation required)
 */
export async function revokeRefreshToken(token: string): Promise<boolean> {
  const refreshToken = await prisma.oAuthRefreshToken.findUnique({
    where: { token },
  })

  if (!refreshToken) {
    return false
  }

  await prisma.oAuthRefreshToken.update({
    where: { id: refreshToken.id },
    data: { revokedAt: new Date() },
  })

  return true
}

/**
 * Revoke a refresh token with client validation
 */
export async function revokeRefreshTokenForClient(token: string, clientId: string): Promise<boolean> {
  const refreshToken = await prisma.oAuthRefreshToken.findUnique({
    where: { token },
  })

  if (!refreshToken || refreshToken.clientId !== clientId) {
    return false
  }

  await prisma.oAuthRefreshToken.update({
    where: { id: refreshToken.id },
    data: { revokedAt: new Date() },
  })

  return true
}

/**
 * Revoke all tokens for a user and client
 */
export async function revokeAllUserTokens(userId: string, clientId: string): Promise<void> {
  await prisma.oAuthRefreshToken.updateMany({
    where: {
      userId,
      clientId,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  })
}

// ============================================================================
// Client Validation
// ============================================================================

/**
 * Validate OAuth client credentials
 */
export async function validateClient(
  clientId: string,
  clientSecret?: string,
  redirectUri?: string
): Promise<{ valid: boolean; client: Awaited<ReturnType<typeof prisma.oAuthClient.findUnique>> }> {
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId },
    include: { app: true },
  })

  if (!client) {
    return { valid: false, client: null }
  }

  // Validate client secret if provided
  if (clientSecret !== undefined) {
    const { verifySecret } = await import('@/lib/apps/oauth')
    if (!verifySecret(clientSecret, client.clientSecret)) {
      return { valid: false, client: null }
    }
  }

  // Validate redirect URI if provided
  if (redirectUri !== undefined) {
    if (!client.redirectUris.includes(redirectUri)) {
      return { valid: false, client: null }
    }
  }

  return { valid: true, client }
}

// ============================================================================
// User Data Fetching
// ============================================================================

/**
 * Fetch complete user data for token generation
 */
export async function getUserDataForTokens(
  userId: string,
  entityId: string,
  appSlug: string
): Promise<UserTokenData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        where: { entityId },
        include: {
          entity: {
            include: {
              licenses: {
                where: { status: 'ACTIVE' },
                include: { app: true },
              },
            },
          },
          scopes: true,
        },
      },
    },
  })

  if (!user || user.memberships.length === 0) {
    return null
  }

  const membership = user.memberships[0]
  const entity = membership.entity

  // Get licensed apps
  const licensedApps = entity.licenses.map(l => l.app.slug)

  // Get permissions - in a full implementation, this would query role-based permissions
  const permissions: string[] = []

  // Get app-specific scope
  const appId = entity.licenses.find(l => l.app.slug === appSlug)?.appId
  const appScope = appId ? membership.scopes.find(s => s.appId === appId) : null
  const scopes: Record<string, { type: string; value: unknown }> = {}
  if (appScope) {
    scopes[appSlug] = {
      type: appScope.scopeType,
      value: appScope.scopeValue,
    }
  }

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    entityId: entity.id,
    entityName: entity.name,
    entitySlug: entity.slug,
    role: membership.role,
    permissions,
    scopes,
    licensedApps,
    impersonatedBy: null,
  }
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Clean up expired authorization codes and refresh tokens
 */
export async function cleanupExpiredTokens(): Promise<{ codesDeleted: number; tokensRevoked: number }> {
  const now = new Date()

  // Delete expired authorization codes
  const codesResult = await prisma.oAuthAuthorizationCode.deleteMany({
    where: {
      expiresAt: { lt: now },
    },
  })

  // Revoke expired refresh tokens
  const tokensResult = await prisma.oAuthRefreshToken.updateMany({
    where: {
      expiresAt: { lt: now },
      revokedAt: null,
    },
    data: { revokedAt: now },
  })

  return {
    codesDeleted: codesResult.count,
    tokensRevoked: tokensResult.count,
  }
}
