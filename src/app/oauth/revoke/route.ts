// ============================================================================
// OAuth Token Revocation Endpoint - POST /oauth/revoke
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revokeRefreshToken } from '@/lib/oauth/tokens'
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
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Unsupported content type' },
      { status: 400 }
    )
  }

  const { token, token_type_hint, client_id, client_secret } = body

  if (!token) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing token parameter' },
      { status: 400 }
    )
  }

  if (!client_id || !client_secret) {
    return NextResponse.json(
      { error: 'invalid_client', error_description: 'Client authentication required' },
      { status: 401 }
    )
  }

  // Validate client credentials
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId: client_id },
  })

  if (!client) {
    return NextResponse.json(
      { error: 'invalid_client', error_description: 'Unknown client' },
      { status: 401 }
    )
  }

  if (!verifySecret(client_secret, client.clientSecret)) {
    return NextResponse.json(
      { error: 'invalid_client', error_description: 'Invalid client credentials' },
      { status: 401 }
    )
  }

  // Try to revoke as refresh token
  // Note: Access tokens are JWTs and can't be revoked (they expire naturally)
  // We can only revoke refresh tokens
  if (token.startsWith('rt_') || token_type_hint === 'refresh_token') {
    await revokeRefreshToken(token)
  }

  // RFC 7009: Always return 200 OK even if token doesn't exist or is invalid
  return new NextResponse(null, { status: 200 })
}
