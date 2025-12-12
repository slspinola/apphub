// ============================================================================
// OpenID Connect Discovery Endpoint - GET /.well-known/openid-configuration
// ============================================================================

import { NextResponse } from 'next/server'
import { getIssuer } from '@/lib/oauth/jwt'

export async function GET() {
  const issuer = getIssuer()

  const configuration = {
    // Required fields
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    userinfo_endpoint: `${issuer}/oauth/userinfo`,
    jwks_uri: `${issuer}/.well-known/jwks.json`,
    
    // Recommended fields
    registration_endpoint: undefined, // Dynamic registration not supported
    scopes_supported: ['openid', 'profile', 'email', 'organization'],
    response_types_supported: ['code'],
    response_modes_supported: ['query'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    
    // Token endpoint authentication methods
    // Note: Only client_secret_post is currently implemented
    token_endpoint_auth_methods_supported: ['client_secret_post'],
    
    // Token signing
    id_token_signing_alg_values_supported: ['RS256'],
    
    // PKCE
    code_challenge_methods_supported: ['S256', 'plain'],
    
    // Claims
    claims_supported: [
      'sub',
      'iss',
      'aud',
      'exp',
      'iat',
      'auth_time',
      'nonce',
      'email',
      'email_verified',
      'name',
      'picture',
      'entity_id',
      'entity_name',
      'entity_slug',
      'role',
    ],
    
    // Subject types
    subject_types_supported: ['public'],
    
    // Revocation
    revocation_endpoint: `${issuer}/oauth/revoke`,
    revocation_endpoint_auth_methods_supported: ['client_secret_post'],
    
    // Service documentation (optional)
    service_documentation: `${issuer}/docs`,
  }

  return NextResponse.json(configuration, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'application/json',
    },
  })
}
