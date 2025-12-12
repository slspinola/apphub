// ============================================================================
// OAuth UserInfo Endpoint - GET /oauth/userinfo
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/oauth/jwt'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'invalid_token', error_description: 'Missing or invalid authorization header' },
      { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
    )
  }

  const token = authHeader.substring(7)

  try {
    const claims = await verifyAccessToken(token)
    const scopes = claims.scope.split(' ')

    // Build userinfo response based on scopes
    const userinfo: Record<string, unknown> = {
      sub: claims.sub,
    }

    if (scopes.includes('profile')) {
      userinfo.name = claims.name
      userinfo.picture = claims.image
    }

    if (scopes.includes('email')) {
      userinfo.email = claims.email
      // Get email_verified from database
      const user = await prisma.user.findUnique({
        where: { id: claims.sub },
        select: { emailVerified: true },
      })
      userinfo.email_verified = !!user?.emailVerified
    }

    if (scopes.includes('organization')) {
      userinfo.entity_id = claims.entity_id
      userinfo.entity_name = claims.entity_name
      userinfo.entity_slug = claims.entity_slug
      userinfo.role = claims.role
    }

    return NextResponse.json(userinfo)
  } catch (error) {
    return NextResponse.json(
      { error: 'invalid_token', error_description: 'Token validation failed' },
      { status: 401, headers: { 'WWW-Authenticate': 'Bearer error="invalid_token"' } }
    )
  }
}

export async function POST(request: NextRequest) {
  // Also support POST for userinfo endpoint
  return GET(request)
}
