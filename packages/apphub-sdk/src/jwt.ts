// ============================================================================
// APPHUB SDK - JWT Token Validation Module
// ============================================================================

import * as jose from 'jose'
import type {
  AppHubConfig,
  AppHubTokenPayload,
  TenantContext,
  AppHubUser,
  AppHubEntity,
  ImpersonatorInfo,
} from './types'

/**
 * JWT validation options
 */
export interface JWTValidationOptions {
  /** Skip audience validation */
  skipAudienceCheck?: boolean
  /** Skip license check */
  skipLicenseCheck?: boolean
  /** Additional required claims */
  requiredClaims?: string[]
}

/**
 * JWT validation result
 */
export interface JWTValidationResult {
  valid: boolean
  payload?: AppHubTokenPayload
  error?: string
}

/**
 * JWT Validator for AppHub tokens
 */
export class AppHubJWT {
  private config: AppHubConfig
  private publicKey: jose.KeyLike | null = null
  private jwksUrl: string
  private issuer: string

  constructor(config: AppHubConfig) {
    this.config = config
    const baseUrl = config.hubUrl.replace(/\/$/, '')
    this.issuer = baseUrl
    this.jwksUrl = `${baseUrl}/.well-known/jwks.json`
  }

  /**
   * Update issuer from OIDC discovery
   * This is called automatically when OAuth client discovers configuration
   */
  setIssuer(issuer: string): void {
    this.issuer = issuer
  }

  /**
   * Update JWKS URL from OIDC discovery
   */
  setJwksUrl(jwksUrl: string): void {
    this.jwksUrl = jwksUrl
  }

  /**
   * Initialize the validator with the public key
   * Call this once at startup for better performance
   */
  async initialize(): Promise<void> {
    if (this.config.publicKey) {
      this.publicKey = await jose.importSPKI(this.config.publicKey, 'RS256')
    }
  }

  /**
   * Get the public key for JWT verification
   */
  private async getPublicKey(): Promise<jose.KeyLike | Uint8Array | ReturnType<typeof jose.createRemoteJWKSet>> {
    if (this.publicKey) {
      return this.publicKey
    }

    if (this.config.publicKey) {
      this.publicKey = await jose.importSPKI(this.config.publicKey, 'RS256')
      return this.publicKey
    }

    // Fetch from JWKS endpoint - returns a function that fetches keys
    return jose.createRemoteJWKSet(new URL(this.jwksUrl))
  }

  /**
   * Validate a JWT access token
   */
  async validateToken(
    token: string,
    options: JWTValidationOptions = {}
  ): Promise<JWTValidationResult> {
    try {
      const key = await this.getPublicKey() as Parameters<typeof jose.jwtVerify>[1]
      
      const verifyOptions: jose.JWTVerifyOptions = {
        issuer: this.issuer,
        algorithms: ['RS256'],
      }

      // Add audience check unless skipped
      if (!options.skipAudienceCheck) {
        verifyOptions.audience = this.config.appSlug
      }

      const { payload } = await jose.jwtVerify(token, key, verifyOptions)

      const tokenPayload = payload as unknown as AppHubTokenPayload

      // Check license unless skipped
      if (!options.skipLicenseCheck) {
        if (!tokenPayload.licensed_apps?.includes(this.config.appSlug)) {
          return {
            valid: false,
            error: `Entity is not licensed for app: ${this.config.appSlug}`,
          }
        }
      }

      // Check additional required claims
      if (options.requiredClaims) {
        for (const claim of options.requiredClaims) {
          if (!(claim in tokenPayload)) {
            return {
              valid: false,
              error: `Missing required claim: ${claim}`,
            }
          }
        }
      }

      return {
        valid: true,
        payload: tokenPayload,
      }
    } catch (error) {
      if (error instanceof jose.errors.JWTExpired) {
        return { valid: false, error: 'Token has expired' }
      }
      if (error instanceof jose.errors.JWTClaimValidationFailed) {
        return { valid: false, error: `Claim validation failed: ${error.message}` }
      }
      if (error instanceof jose.errors.JWSSignatureVerificationFailed) {
        return { valid: false, error: 'Invalid token signature' }
      }
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Token validation failed',
      }
    }
  }

  /**
   * Validate and extract tenant context from token
   */
  async getTenantContext(
    token: string,
    options: JWTValidationOptions = {}
  ): Promise<TenantContext> {
    const result = await this.validateToken(token, options)

    if (!result.valid || !result.payload) {
      throw new AppHubJWTError('invalid_token', result.error ?? 'Invalid token')
    }

    const payload = result.payload

    const user: AppHubUser = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      image: payload.image ?? null,
    }

    const entity: AppHubEntity = {
      id: payload.entity_id,
      name: payload.entity_name,
      slug: payload.entity_slug,
    }

    const scope = payload.scopes?.[this.config.appSlug] ?? null

    // Map impersonated_by to ImpersonatorInfo type
    let impersonatedBy: ImpersonatorInfo | null = null
    if (payload.impersonated_by) {
      impersonatedBy = {
        id: payload.impersonated_by.id,
        email: payload.impersonated_by.email,
        role: payload.impersonated_by.role,
      }
    }

    return {
      user,
      entity,
      role: payload.role,
      permissions: payload.permissions ?? [],
      scope,
      isImpersonated: !!payload.impersonated_by,
      impersonatedBy,
      licensedApps: payload.licensed_apps ?? [],
      tokenPayload: payload,
    }
  }

  /**
   * Decode a token without verification (for debugging)
   * WARNING: Never trust unverified tokens for authorization
   */
  decodeToken(token: string): AppHubTokenPayload | null {
    try {
      const decoded = jose.decodeJwt(token)
      return decoded as unknown as AppHubTokenPayload
    } catch {
      return null
    }
  }

  /**
   * Check if a token is expired (without full validation)
   */
  isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token)
    if (!decoded?.exp) return true
    return Date.now() >= decoded.exp * 1000
  }

  /**
   * Get time until token expires in seconds
   * Returns negative value if already expired
   */
  getTokenExpiresIn(token: string): number {
    const decoded = this.decodeToken(token)
    if (!decoded?.exp) return -1
    return Math.floor(decoded.exp - Date.now() / 1000)
  }
}

/**
 * JWT-specific error class
 */
export class AppHubJWTError extends Error {
  code: string
  
  constructor(code: string, message: string) {
    super(message)
    this.name = 'AppHubJWTError'
    this.code = code
  }
}

/**
 * Create a JWT validator instance
 */
export function createJWTValidator(config: AppHubConfig): AppHubJWT {
  return new AppHubJWT(config)
}

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | null | undefined): string | null {
  if (!authHeader) return null
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null
  }
  return parts[1]
}

/**
 * Extract bearer token from request
 * Works with both Request and IncomingMessage-like objects
 */
export function extractTokenFromRequest(
  req: { headers: Headers | Record<string, string | string[] | undefined> }
): string | null {
  let authHeader: string | null = null
  
  if (req.headers instanceof Headers) {
    authHeader = req.headers.get('authorization')
  } else {
    const header = req.headers['authorization'] ?? req.headers['Authorization']
    authHeader = Array.isArray(header) ? header[0] : header ?? null
  }
  
  return extractBearerToken(authHeader)
}

