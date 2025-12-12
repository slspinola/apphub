// ============================================================================
// OAuth Token Endpoint - POST /oauth/token
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyCodeChallenge } from '@/lib/oauth/pkce'
import { consumeAuthorizationCode, validateRefreshToken, generateTokenResponse, createRefreshToken } from '@/lib/oauth/tokens'
import { signAccessToken, signIdToken } from '@/lib/oauth/jwt'
import { verifySecret } from '@/lib/apps/oauth'

export async function POST(request: NextRequest) {
  // Parse form data or JSON
  let body: Record<string, string>
  const contentType = request.headers.get('content-type') || ''
  
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await request.formData()
    body = Object.fromEntries(formData.entries()) as Record<string, string>
  } else if (contentType.includes('application/json')) {
    body = await request.json()
  } else {
    return errorResponse('invalid_request', 'Unsupported content type')
  }

  const grantType = body.grant_type

  if (grantType === 'authorization_code') {
    return handleAuthorizationCodeGrant(body)
  } else if (grantType === 'refresh_token') {
    return handleRefreshTokenGrant(body)
  } else {
    return errorResponse('unsupported_grant_type', 'Only authorization_code and refresh_token grants are supported')
  }
}

async function handleAuthorizationCodeGrant(body: Record<string, string>) {
  const { code, redirect_uri, client_id, client_secret, code_verifier } = body

  if (!code || !redirect_uri || !client_id || !client_secret) {
    return errorResponse('invalid_request', 'Missing required parameters')
  }

  // Validate client credentials
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId: client_id },
  })

  if (!client) {
    return errorResponse('invalid_client', 'Unknown client')
  }

  if (!verifySecret(client_secret, client.clientSecret)) {
    return errorResponse('invalid_client', 'Invalid client credentials')
  }

  // Consume authorization code
  const authCode = await consumeAuthorizationCode(code)
  
  if (!authCode) {
    return errorResponse('invalid_grant', 'Invalid or expired authorization code')
  }

  // Validate redirect URI matches
  if (authCode.redirectUri !== redirect_uri) {
    return errorResponse('invalid_grant', 'Redirect URI mismatch')
  }

  // Validate client ID matches
  if (authCode.clientId !== client_id) {
    return errorResponse('invalid_grant', 'Client ID mismatch')
  }

  // Validate PKCE
  if (authCode.codeChallenge) {
    if (!code_verifier) {
      return errorResponse('invalid_request', 'Missing code_verifier')
    }
    if (!verifyCodeChallenge(code_verifier, authCode.codeChallenge, authCode.codeChallengeMethod || 'S256')) {
      return errorResponse('invalid_grant', 'Invalid code_verifier')
    }
  }

  // Get user and membership data
  const user = await prisma.user.findUnique({
    where: { id: authCode.userId },
  })

  if (!user) {
    return errorResponse('invalid_grant', 'User not found')
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: { entity: true },
    orderBy: { createdAt: 'asc' },
  })

  if (!membership) {
    return errorResponse('invalid_grant', 'User has no entity membership')
  }

  // Get user's permissions for this app
  const oauthClient = await prisma.oAuthClient.findUnique({
    where: { clientId: client_id },
    include: { app: { include: { permissions: true } } },
  })

  const permissions = oauthClient?.app.permissions.map(p => p.slug) || []

  // Get licensed apps for entity
  const licenses = await prisma.license.findMany({
    where: {
      entityId: membership.entityId,
      status: { in: ['ACTIVE', 'TRIAL'] },
    },
    include: { app: true },
  })

  const licensedApps = licenses.map(l => l.app.slug)

  // Generate tokens
  const tokenResponse = await generateTokenResponse({
    user,
    membership,
    client,
    scope: authCode.scope,
    permissions,
    licensedApps,
    nonce: authCode.nonce,
  })

  return NextResponse.json(tokenResponse, {
    headers: {
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache',
    },
  })
}

async function handleRefreshTokenGrant(body: Record<string, string>) {
  const { refresh_token, client_id, client_secret } = body

  if (!refresh_token || !client_id || !client_secret) {
    return errorResponse('invalid_request', 'Missing required parameters')
  }

  // Validate client credentials
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId: client_id },
  })

  if (!client) {
    return errorResponse('invalid_client', 'Unknown client')
  }

  if (!verifySecret(client_secret, client.clientSecret)) {
    return errorResponse('invalid_client', 'Invalid client credentials')
  }

  // Validate refresh token and check client ID matches BEFORE revoking
  const tokenData = await prisma.oAuthRefreshToken.findUnique({
    where: { token: refresh_token },
  })
  
  if (!tokenData) {
    return errorResponse('invalid_grant', 'Invalid or expired refresh token')
  }

  // Check if token is revoked
  if (tokenData.revokedAt) {
    return errorResponse('invalid_grant', 'Refresh token has been revoked')
  }

  // Check if token is expired
  if (tokenData.expiresAt < new Date()) {
    return errorResponse('invalid_grant', 'Refresh token has expired')
  }

  // Validate client ID matches BEFORE revoking
  if (tokenData.clientId !== client_id) {
    return errorResponse('invalid_grant', 'Token was not issued to this client')
  }

  // Revoke the old refresh token (refresh token rotation)
  await prisma.oAuthRefreshToken.update({
    where: { id: tokenData.id },
    data: { revokedAt: new Date() },
  })

  // Get user and membership data
  const user = await prisma.user.findUnique({
    where: { id: tokenData.userId },
  })

  if (!user) {
    return errorResponse('invalid_grant', 'User not found')
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: { entity: true },
    orderBy: { createdAt: 'asc' },
  })

  if (!membership) {
    return errorResponse('invalid_grant', 'User has no entity membership')
  }

  // Get permissions and licensed apps
  const oauthClient = await prisma.oAuthClient.findUnique({
    where: { clientId: client_id },
    include: { app: { include: { permissions: true } } },
  })

  const permissions = oauthClient?.app.permissions.map(p => p.slug) || []

  const licenses = await prisma.license.findMany({
    where: {
      entityId: membership.entityId,
      status: { in: ['ACTIVE', 'TRIAL'] },
    },
    include: { app: true },
  })

  const licensedApps = licenses.map(l => l.app.slug)

  // Generate new tokens
  const tokenResponse = await generateTokenResponse({
    user,
    membership,
    client,
    scope: tokenData.scope,
    permissions,
    licensedApps,
  })

  return NextResponse.json(tokenResponse, {
    headers: {
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache',
    },
  })
}

function errorResponse(error: string, description: string): NextResponse {
  return NextResponse.json(
    { error, error_description: description },
    { 
      status: 400,
      headers: {
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
      },
    }
  )
}
