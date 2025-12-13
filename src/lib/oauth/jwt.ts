// ============================================================================
// OAuth Provider - JWT Infrastructure
// ============================================================================

import * as jose from 'jose'
import crypto from 'crypto'

// Types for JWT claims
export interface AccessTokenClaims {
  iss: string
  sub: string
  aud: string[]
  exp: number
  iat: number
  jti: string
  azp: string
  scope: string
  email: string
  name: string | null
  image?: string | null
  entity_id: string
  entity_name: string
  entity_slug: string
  role: string
  permissions: string[]
  scopes?: Record<string, { type: string; value: unknown }>
  licensed_apps: string[]
  impersonated_by?: { id: string; email: string; role: string } | null
}

export interface IdTokenClaims {
  iss: string
  sub: string
  aud: string
  exp: number
  iat: number
  auth_time?: number
  nonce?: string
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
  entity_id?: string
  entity_name?: string
  entity_slug?: string
  role?: string
}

let privateKey: CryptoKey | null = null
let publicKey: CryptoKey | null = null
let jwk: jose.JWK | null = null
let keyId: string | null = null

async function getKeys(): Promise<{
  privateKey: CryptoKey
  publicKey: CryptoKey
  jwk: jose.JWK
  keyId: string
}> {
  if (privateKey && publicKey && jwk && keyId) {
    return { privateKey, publicKey, jwk, keyId }
  }

  const envPrivateKey = process.env.OAUTH_JWT_PRIVATE_KEY
  const envPublicKey = process.env.OAUTH_JWT_PUBLIC_KEY

  if (envPrivateKey && envPublicKey) {
    privateKey = await jose.importPKCS8(envPrivateKey, 'RS256')
    publicKey = await jose.importSPKI(envPublicKey, 'RS256')
    jwk = await jose.exportJWK(publicKey)
    keyId = process.env.OAUTH_JWT_KEY_ID || 'apphub-key-1'
    jwk.kid = keyId
    jwk.use = 'sig'
    jwk.alg = 'RS256'
  } else {
    console.warn('[OAuth] No JWT keys provided, generating new keypair')
    const { privateKey: priv, publicKey: pub } = await jose.generateKeyPair('RS256', {
      modulusLength: 2048,
    })
    privateKey = priv
    publicKey = pub
    jwk = await jose.exportJWK(publicKey)
    keyId = `apphub-dev-${crypto.randomBytes(4).toString('hex')}`
    jwk.kid = keyId
    jwk.use = 'sig'
    jwk.alg = 'RS256'
  }

  return { privateKey, publicKey, jwk, keyId }
}

export async function getJWKS(): Promise<{ keys: jose.JWK[] }> {
  const { jwk } = await getKeys()
  return { keys: [jwk] }
}

export function getIssuer(): string {
  return process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export async function signAccessToken(
  claims: Omit<AccessTokenClaims, 'iss' | 'exp' | 'iat' | 'jti'>,
  expiresIn: number = 3600
): Promise<string> {
  const { privateKey, keyId } = await getKeys()
  const now = Math.floor(Date.now() / 1000)
  
  const payload: AccessTokenClaims = {
    ...claims,
    iss: getIssuer(),
    exp: now + expiresIn,
    iat: now,
    jti: `at_${crypto.randomBytes(16).toString('hex')}`,
  }

  const jwt = await new jose.SignJWT(payload as unknown as jose.JWTPayload)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: keyId })
    .sign(privateKey)

  return jwt
}

export async function signIdToken(
  claims: Omit<IdTokenClaims, 'iss' | 'exp' | 'iat'>,
  expiresIn: number = 3600
): Promise<string> {
  const { privateKey, keyId } = await getKeys()
  const now = Math.floor(Date.now() / 1000)
  
  const payload: IdTokenClaims = {
    ...claims,
    iss: getIssuer(),
    exp: now + expiresIn,
    iat: now,
    auth_time: now,
  }

  const jwt = await new jose.SignJWT(payload as unknown as jose.JWTPayload)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: keyId })
    .sign(privateKey)

  return jwt
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims> {
  const { publicKey } = await getKeys()
  const { payload } = await jose.jwtVerify(token, publicKey, { issuer: getIssuer() })
  return payload as unknown as AccessTokenClaims
}

export function decodeToken(token: string): jose.JWTPayload | null {
  try {
    return jose.decodeJwt(token)
  } catch {
    return null
  }
}
