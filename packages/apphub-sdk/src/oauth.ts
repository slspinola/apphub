// ============================================================================
// APPHUB SDK - OAuth Module
// ============================================================================

import type {
  AppHubConfig,
  AuthorizationParams,
  TokenResponse,
  OAuthError,
  OIDCConfiguration,
  TokenIntrospectionResponse,
} from './types'

/**
 * Generate a cryptographically secure random string
 */
function generateRandomString(length: number): string {
  const array = new Uint8Array(length)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    // Node.js fallback
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('crypto')
    nodeCrypto.randomFillSync(array)
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate base64url encoded string
 */
function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Generate SHA-256 hash
 */
async function sha256(plain: string): Promise<ArrayBuffer> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder()
    const data = encoder.encode(plain)
    return crypto.subtle.digest('SHA-256', data)
  } else {
    // Node.js fallback
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('crypto')
    const hash = nodeCrypto.createHash('sha256').update(plain).digest()
    return hash.buffer.slice(hash.byteOffset, hash.byteOffset + hash.byteLength)
  }
}

/**
 * OAuth client for AppHub authentication
 */
export class AppHubOAuth {
  private config: AppHubConfig
  private tokenEndpoint: string
  private authorizationEndpoint: string
  private userInfoEndpoint: string
  private revocationEndpoint: string
  private introspectionEndpoint: string
  private jwksUri: string
  private issuer: string
  private oidcConfig: OIDCConfiguration | null = null
  private discoveryPromise: Promise<OIDCConfiguration> | null = null

  constructor(config: AppHubConfig) {
    this.config = config
    const baseUrl = config.hubUrl.replace(/\/$/, '')
    this.issuer = baseUrl
    this.authorizationEndpoint = `${baseUrl}/oauth/authorize`
    this.tokenEndpoint = `${baseUrl}/oauth/token`
    this.userInfoEndpoint = `${baseUrl}/oauth/userinfo`
    this.revocationEndpoint = `${baseUrl}/oauth/revoke`
    this.introspectionEndpoint = `${baseUrl}/oauth/introspect`
    this.jwksUri = `${baseUrl}/.well-known/jwks.json`
  }

  /**
   * Discover OIDC configuration from AppHub
   * This will auto-configure endpoints if discovery is successful
   */
  async discoverConfiguration(): Promise<OIDCConfiguration> {
    // Return cached configuration if available
    if (this.oidcConfig) {
      return this.oidcConfig
    }

    // Return existing promise if discovery is in progress
    if (this.discoveryPromise) {
      return this.discoveryPromise
    }

    // Start discovery
    this.discoveryPromise = (async () => {
      try {
        const discoveryUrl = `${this.issuer}/.well-known/openid-configuration`
        const response = await fetch(discoveryUrl)

        if (!response.ok) {
          throw new AppHubOAuthError(
            'discovery_failed',
            `Failed to fetch OIDC configuration: ${response.statusText}`
          )
        }

        const config = await response.json() as OIDCConfiguration
        this.oidcConfig = config

        // Update endpoints from discovery
        if (config.authorization_endpoint) {
          this.authorizationEndpoint = config.authorization_endpoint
        }
        if (config.token_endpoint) {
          this.tokenEndpoint = config.token_endpoint
        }
        if (config.userinfo_endpoint) {
          this.userInfoEndpoint = config.userinfo_endpoint
        }
        if (config.revocation_endpoint) {
          this.revocationEndpoint = config.revocation_endpoint
        }
        if (config.introspection_endpoint) {
          this.introspectionEndpoint = config.introspection_endpoint
        }
        if (config.jwks_uri) {
          this.jwksUri = config.jwks_uri
        }
        if (config.issuer) {
          this.issuer = config.issuer
        }

        return config
      } catch (error) {
        this.discoveryPromise = null
        throw error instanceof AppHubOAuthError
          ? error
          : new AppHubOAuthError(
              'discovery_failed',
              error instanceof Error ? error.message : 'Failed to discover OIDC configuration'
            )
      }
    })()

    return this.discoveryPromise
  }

  /**
   * Initialize OAuth client with OIDC discovery
   * Call this once at startup for better performance
   */
  async initialize(): Promise<void> {
    try {
      await this.discoverConfiguration()
    } catch (error) {
      // Discovery failed, but we can still use hardcoded endpoints
      // Log warning but don't throw
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('OIDC discovery failed, using default endpoints:', error)
      }
    }
  }

  /**
   * Get the current OIDC configuration (cached or discovered)
   */
  async getConfiguration(): Promise<OIDCConfiguration> {
    return this.discoverConfiguration()
  }

  /**
   * Generate PKCE code verifier
   */
  generateCodeVerifier(): string {
    return generateRandomString(32)
  }

  /**
   * Generate PKCE code challenge from verifier
   */
  async generateCodeChallenge(verifier: string): Promise<string> {
    const hashed = await sha256(verifier)
    return base64urlEncode(hashed)
  }

  /**
   * Generate a random state parameter for CSRF protection
   */
  generateState(): string {
    return generateRandomString(16)
  }

  /**
   * Generate a random nonce for OpenID Connect
   */
  generateNonce(): string {
    return generateRandomString(16)
  }

  /**
   * Create authorization URL with all required parameters
   */
  async createAuthorizationUrl(options?: {
    state?: string
    codeVerifier?: string
    scopes?: string[]
    redirectUri?: string
    nonce?: string
  }): Promise<AuthorizationParams> {
    const state = options?.state ?? this.generateState()
    const codeVerifier = options?.codeVerifier ?? this.generateCodeVerifier()
    const codeChallenge = await this.generateCodeChallenge(codeVerifier)
    const scopes = options?.scopes ?? ['openid', 'profile', 'email', 'organization']
    const redirectUri = options?.redirectUri ?? this.config.redirectUri
    const nonce = options?.nonce ?? (scopes.includes('openid') ? this.generateNonce() : undefined)

    if (!redirectUri) {
      throw new Error('Redirect URI is required. Provide it in config or options.')
    }

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })

    // Add nonce for OpenID Connect
    if (nonce) {
      params.set('nonce', nonce)
    }

    return {
      state,
      codeVerifier,
      codeChallenge,
      authorizationUrl: `${this.authorizationEndpoint}?${params.toString()}`,
      nonce,
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(
    code: string,
    codeVerifier: string,
    redirectUri?: string
  ): Promise<TokenResponse> {
    const uri = redirectUri ?? this.config.redirectUri
    if (!uri) {
      throw new Error('Redirect URI is required')
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: uri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code_verifier: codeVerifier,
    })

    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (!response.ok) {
      const error: OAuthError = await response.json()
      throw new AppHubOAuthError(
        error.error,
        error.error_description ?? 'Token exchange failed'
      )
    }

    return response.json()
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    })

    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (!response.ok) {
      const error: OAuthError = await response.json()
      throw new AppHubOAuthError(
        error.error,
        error.error_description ?? 'Token refresh failed'
      )
    }

    return response.json()
  }

  /**
   * Fetch user info from AppHub
   */
  async getUserInfo(accessToken: string): Promise<Record<string, unknown>> {
    const response = await fetch(this.userInfoEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new AppHubOAuthError('user_info_error', 'Failed to fetch user info')
    }

    return response.json()
  }

  /**
   * Revoke a token (access or refresh)
   */
  async revokeToken(token: string, tokenType: 'access_token' | 'refresh_token' = 'access_token'): Promise<void> {
    const body = new URLSearchParams({
      token,
      token_type_hint: tokenType,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    })

    const response = await fetch(this.revocationEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (!response.ok) {
      throw new AppHubOAuthError('revoke_error', 'Failed to revoke token')
    }
  }

  /**
   * Introspect a token to get its metadata and validity
   * Returns token information including active status, expiration, scopes, etc.
   */
  async introspectToken(
    token: string,
    tokenTypeHint?: 'access_token' | 'refresh_token'
  ): Promise<TokenIntrospectionResponse> {
    const body = new URLSearchParams({
      token,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    })

    if (tokenTypeHint) {
      body.set('token_type_hint', tokenTypeHint)
    }

    const response = await fetch(this.introspectionEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (!response.ok) {
      const error: OAuthError = await response.json().catch(() => ({
        error: 'introspection_failed',
        error_description: 'Failed to introspect token',
      }))
      throw new AppHubOAuthError(
        error.error,
        error.error_description ?? 'Token introspection failed'
      )
    }

    return response.json()
  }

  /**
   * Get JWKS URI for JWT verification
   */
  getJwksUri(): string {
    return this.jwksUri
  }

  /**
   * Get issuer URL
   */
  getIssuer(): string {
    return this.issuer
  }
}

/**
 * OAuth-specific error class
 */
export class AppHubOAuthError extends Error {
  code: string
  
  constructor(code: string, message: string) {
    super(message)
    this.name = 'AppHubOAuthError'
    this.code = code
  }
}

/**
 * Create an OAuth client instance
 */
export function createOAuthClient(config: AppHubConfig): AppHubOAuth {
  return new AppHubOAuth(config)
}

