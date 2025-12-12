// ============================================================================
// OAuth Authorization Endpoint - GET /oauth/authorize
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createAuthorizationCode } from '@/lib/oauth/tokens'
import { isValidCodeChallengeMethod } from '@/lib/oauth/pkce'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  // Extract OAuth parameters
  const clientId = searchParams.get('client_id')
  const redirectUri = searchParams.get('redirect_uri')
  const responseType = searchParams.get('response_type')
  const scope = searchParams.get('scope') || 'openid'
  const state = searchParams.get('state')
  const nonce = searchParams.get('nonce') // OpenID Connect nonce for replay protection
  const codeChallenge = searchParams.get('code_challenge')
  const codeChallengeMethod = searchParams.get('code_challenge_method') || 'S256'

  // Validate required parameters
  if (!clientId) {
    return errorResponse('invalid_request', 'Missing client_id parameter')
  }

  if (!redirectUri) {
    return errorResponse('invalid_request', 'Missing redirect_uri parameter')
  }

  if (responseType !== 'code') {
    return errorResponse('unsupported_response_type', 'Only response_type=code is supported')
  }

  // Validate PKCE (required)
  if (!codeChallenge) {
    return errorResponse('invalid_request', 'PKCE code_challenge is required')
  }

  if (!isValidCodeChallengeMethod(codeChallengeMethod)) {
    return errorResponse('invalid_request', 'Invalid code_challenge_method')
  }

  // Lookup OAuth client
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId },
    include: { app: true },
  })

  if (!client) {
    return errorResponse('invalid_client', 'Unknown client_id')
  }

  // Validate redirect URI
  if (!client.redirectUris.includes(redirectUri)) {
    return errorResponse('invalid_request', 'Invalid redirect_uri')
  }

  // Validate scopes
  const requestedScopes = scope.split(' ')
  const invalidScopes = requestedScopes.filter(s => !client.scopes.includes(s))
  if (invalidScopes.length > 0) {
    return redirectWithError(redirectUri, state, 'invalid_scope', `Invalid scopes: ${invalidScopes.join(', ')}`)
  }

  // Check if user is authenticated
  const session = await auth()
  
  if (!session?.user?.id) {
    // Redirect to login with return URL
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Get user's active entity membership
  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: { entity: true },
    orderBy: { createdAt: 'asc' },
  })

  if (!membership) {
    return redirectWithError(redirectUri, state, 'access_denied', 'User has no entity membership')
  }

  // Check if entity has license for this app
  const license = await prisma.license.findUnique({
    where: {
      entityId_appId: {
        entityId: membership.entityId,
        appId: client.appId,
      },
    },
  })

  if (!license || !['ACTIVE', 'TRIAL'].includes(license.status)) {
    return redirectWithError(redirectUri, state, 'access_denied', 'Entity does not have an active license for this app')
  }

  // For internal apps, auto-approve (skip consent screen)
  // Generate authorization code directly
  const code = await createAuthorizationCode({
    clientId: client.clientId,
    userId: session.user.id,
    redirectUri,
    scope,
    codeChallenge,
    codeChallengeMethod,
    nonce: nonce || undefined,
  })

  // Redirect back to client with authorization code
  const callbackUrl = new URL(redirectUri)
  callbackUrl.searchParams.set('code', code)
  if (state) {
    callbackUrl.searchParams.set('state', state)
  }

  return NextResponse.redirect(callbackUrl)
}

function errorResponse(error: string, description: string): NextResponse {
  return NextResponse.json(
    { error, error_description: description },
    { status: 400 }
  )
}

function redirectWithError(
  redirectUri: string,
  state: string | null,
  error: string,
  description: string
): NextResponse {
  const url = new URL(redirectUri)
  url.searchParams.set('error', error)
  url.searchParams.set('error_description', description)
  if (state) {
    url.searchParams.set('state', state)
  }
  return NextResponse.redirect(url)
}
