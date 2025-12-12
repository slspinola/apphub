// ============================================================================
// JSON Web Key Set Endpoint - GET /.well-known/jwks.json
// ============================================================================

import { NextResponse } from 'next/server'
import { getJWKS } from '@/lib/oauth/jwt'

export async function GET() {
  const jwks = await getJWKS()

  return NextResponse.json(jwks, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'application/json',
    },
  })
}
