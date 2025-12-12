// ============================================================================
// OAuth Provider - PKCE (Proof Key for Code Exchange) Utilities
// ============================================================================

import crypto from 'crypto'

/**
 * Generate a code verifier for PKCE
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Generate a code challenge from a verifier using S256 method
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url')
}

/**
 * Verify a code verifier against a stored code challenge
 */
export function verifyCodeChallenge(
  codeVerifier: string,
  codeChallenge: string,
  codeChallengeMethod: string = 'S256'
): boolean {
  if (codeChallengeMethod === 'plain') {
    return codeVerifier === codeChallenge
  }
  
  if (codeChallengeMethod === 'S256') {
    const computedChallenge = generateCodeChallenge(codeVerifier)
    return computedChallenge === codeChallenge
  }
  
  return false
}

/**
 * Validate code challenge method
 */
export function isValidCodeChallengeMethod(method: string): boolean {
  return method === 'S256' || method === 'plain'
}

/**
 * Generate a secure authorization code
 */
export function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Generate a secure refresh token
 */
export function generateRefreshToken(): string {
  return `rt_${crypto.randomBytes(32).toString('base64url')}`
}
