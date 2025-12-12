// ============================================================================
// APPHUB SDK - API Client Module
// ============================================================================

import type {
  AppHubConfig,
  PermissionDefinition,
  ScopeTypeDefinition,
  ApiResponse,
  ApiError,
  App,
  Plan,
  License,
  ScopeOption,
} from './types'

/**
 * API client for communicating with AppHub
 */
export class AppHubApiClient {
  private config: AppHubConfig
  private baseUrl: string
  private serviceToken: string | null = null

  constructor(config: AppHubConfig) {
    this.config = config
    this.baseUrl = `${config.hubUrl.replace(/\/$/, '')}/api/v1`
  }

  /**
   * Set the service token for server-to-server API calls
   */
  setServiceToken(token: string): void {
    this.serviceToken = token
  }

  /**
   * Make an authenticated API request
   */
  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown
      token?: string
      headers?: Record<string, string>
    }
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const token = options?.token ?? this.serviceToken

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-App-ID': this.config.appSlug,
      ...options?.headers,
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'unknown_error',
        message: 'Request failed',
        statusCode: response.status,
      }))
      throw new AppHubApiError(
        error.error ?? 'api_error',
        error.message ?? 'API request failed',
        response.status,
        error.details
      )
    }

    return response.json()
  }

  // ============================================================================
  // APP INFORMATION
  // ============================================================================

  /**
   * Get current app information
   */
  async getApp(token?: string): Promise<App> {
    const response = await this.request<ApiResponse<App>>(
      'GET',
      `/apps/${this.config.appSlug}`,
      { token }
    )
    return response.data
  }

  // ============================================================================
  // PERMISSIONS
  // ============================================================================

  /**
   * Sync permissions with AppHub
   * This registers or updates all permissions for your app
   */
  async syncPermissions(
    permissions: PermissionDefinition[],
    token?: string
  ): Promise<{ created: number; updated: number; deleted: number; total: number }> {
    const response = await this.request<ApiResponse<{
      created: number
      updated: number
      deleted: number
      total: number
    }>>(
      'POST',
      `/apps/${this.config.appSlug}/permissions/sync`,
      {
        body: { permissions },
        token,
      }
    )
    return response.data
  }

  /**
   * Get current permissions registered for the app
   */
  async getPermissions(token?: string): Promise<PermissionDefinition[]> {
    const response = await this.request<ApiResponse<PermissionDefinition[]>>(
      'GET',
      `/apps/${this.config.appSlug}/permissions`,
      { token }
    )
    return response.data
  }

  // ============================================================================
  // SCOPE TYPES
  // ============================================================================

  /**
   * Sync scope types with AppHub
   */
  async syncScopeTypes(
    scopeTypes: ScopeTypeDefinition[],
    token?: string
  ): Promise<{ created: number; updated: number; deleted: number; total: number }> {
    const response = await this.request<ApiResponse<{
      created: number
      updated: number
      deleted: number
      total: number
    }>>(
      'POST',
      `/apps/${this.config.appSlug}/scope-types/sync`,
      {
        body: { scopeTypes },
        token,
      }
    )
    return response.data
  }

  /**
   * Get current scope types registered for the app
   */
  async getScopeTypes(token?: string): Promise<ScopeTypeDefinition[]> {
    const response = await this.request<ApiResponse<ScopeTypeDefinition[]>>(
      'GET',
      `/apps/${this.config.appSlug}/scope-types`,
      { token }
    )
    return response.data
  }

  // ============================================================================
  // PLANS & LICENSING
  // ============================================================================

  /**
   * Get available plans for the app
   */
  async getPlans(token?: string): Promise<Plan[]> {
    const response = await this.request<ApiResponse<Plan[]>>(
      'GET',
      `/apps/${this.config.appSlug}/plans`,
      { token }
    )
    return response.data
  }

  /**
   * Get license for a specific entity
   */
  async getLicense(entityId: string, token?: string): Promise<License | null> {
    try {
      const response = await this.request<ApiResponse<License>>(
        'GET',
        `/entities/${entityId}/licenses/${this.config.appSlug}`,
        { token }
      )
      return response.data
    } catch (error) {
      if (error instanceof AppHubApiError && error.statusCode === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Check if an entity is licensed for this app
   */
  async isLicensed(entityId: string, token?: string): Promise<boolean> {
    const license = await this.getLicense(entityId, token)
    return license !== null && ['active', 'trial'].includes(license.status)
  }

  // ============================================================================
  // SCOPE OPTIONS PROXY
  // ============================================================================

  /**
   * Provide scope options for AppHub to display
   * AppHub will call your optionsEndpoint and proxy through this
   */
  async getScopeOptions(
    scopeType: string,
    entityId: string,
    token?: string
  ): Promise<ScopeOption[]> {
    const response = await this.request<ApiResponse<ScopeOption[]>>(
      'GET',
      `/apps/${this.config.appSlug}/scope-options/${scopeType}?entityId=${entityId}`,
      { token }
    )
    return response.data
  }

  // ============================================================================
  // ENTITY INFORMATION
  // ============================================================================

  /**
   * Get entity information
   */
  async getEntity(entityId: string, token?: string): Promise<{
    id: string
    name: string
    slug: string
    logo?: string
    parentId?: string
  }> {
    const response = await this.request<ApiResponse<{
      id: string
      name: string
      slug: string
      logo?: string
      parentId?: string
    }>>(
      'GET',
      `/entities/${entityId}`,
      { token }
    )
    return response.data
  }

  /**
   * Get entity members with their roles and permissions for this app
   */
  async getEntityMembers(
    entityId: string,
    token?: string
  ): Promise<Array<{
    userId: string
    email: string
    name: string
    role: string
    permissions: string[]
    scope?: { type: string; value: unknown }
  }>> {
    const response = await this.request<ApiResponse<Array<{
      userId: string
      email: string
      name: string
      role: string
      permissions: string[]
      scope?: { type: string; value: unknown }
    }>>>(
      'GET',
      `/entities/${entityId}/members?appId=${this.config.appSlug}`,
      { token }
    )
    return response.data
  }

  // ============================================================================
  // WEBHOOKS
  // ============================================================================

  /**
   * Test webhook connectivity (sends a test event)
   */
  async testWebhook(webhookId: string, token?: string): Promise<{
    success: boolean
    statusCode: number
    responseTime: number
  }> {
    const response = await this.request<ApiResponse<{
      success: boolean
      statusCode: number
      responseTime: number
    }>>(
      'POST',
      `/apps/${this.config.appSlug}/webhooks/${webhookId}/test`,
      { token }
    )
    return response.data
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Health check for AppHub connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.hubUrl}/health`)
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Get AppHub public key for JWT verification
   */
  async getPublicKey(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/.well-known/jwks.json`)
    if (!response.ok) {
      throw new AppHubApiError('jwks_error', 'Failed to fetch JWKS', response.status)
    }
    const jwks = await response.json()
    // Return the first key's public key
    if (jwks.keys && jwks.keys.length > 0) {
      return JSON.stringify(jwks.keys[0])
    }
    throw new AppHubApiError('jwks_error', 'No keys found in JWKS', 404)
  }
}

/**
 * API-specific error class
 */
export class AppHubApiError extends Error {
  code: string
  statusCode: number
  details?: Record<string, unknown>
  
  constructor(
    code: string,
    message: string,
    statusCode: number,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppHubApiError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }

  /**
   * Check if error is a not found error
   */
  isNotFound(): boolean {
    return this.statusCode === 404
  }

  /**
   * Check if error is an authorization error
   */
  isUnauthorized(): boolean {
    return this.statusCode === 401
  }

  /**
   * Check if error is a forbidden error
   */
  isForbidden(): boolean {
    return this.statusCode === 403
  }
}

/**
 * Create an API client instance
 */
export function createApiClient(config: AppHubConfig): AppHubApiClient {
  return new AppHubApiClient(config)
}

