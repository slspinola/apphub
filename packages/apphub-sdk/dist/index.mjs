import * as jose from 'jose';

var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/oauth.ts
function generateRandomString(length) {
  const array = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    const nodeCrypto = __require("crypto");
    nodeCrypto.randomFillSync(array);
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function base64urlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function sha256(plain) {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return crypto.subtle.digest("SHA-256", data);
  } else {
    const nodeCrypto = __require("crypto");
    const hash = nodeCrypto.createHash("sha256").update(plain).digest();
    return hash.buffer.slice(hash.byteOffset, hash.byteOffset + hash.byteLength);
  }
}
var AppHubOAuth = class {
  constructor(config) {
    this.config = config;
    const baseUrl = config.hubUrl.replace(/\/$/, "");
    this.authorizationEndpoint = `${baseUrl}/oauth/authorize`;
    this.tokenEndpoint = `${baseUrl}/oauth/token`;
    this.userInfoEndpoint = `${baseUrl}/oauth/userinfo`;
  }
  /**
   * Generate PKCE code verifier
   */
  generateCodeVerifier() {
    return generateRandomString(32);
  }
  /**
   * Generate PKCE code challenge from verifier
   */
  async generateCodeChallenge(verifier) {
    const hashed = await sha256(verifier);
    return base64urlEncode(hashed);
  }
  /**
   * Generate a random state parameter for CSRF protection
   */
  generateState() {
    return generateRandomString(16);
  }
  /**
   * Create authorization URL with all required parameters
   */
  async createAuthorizationUrl(options) {
    const state = options?.state ?? this.generateState();
    const codeVerifier = options?.codeVerifier ?? this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const scopes = options?.scopes ?? ["openid", "profile", "email", "organization"];
    const redirectUri = options?.redirectUri ?? this.config.redirectUri;
    if (!redirectUri) {
      throw new Error("Redirect URI is required. Provide it in config or options.");
    }
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scopes.join(" "),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256"
    });
    return {
      state,
      codeVerifier,
      codeChallenge,
      authorizationUrl: `${this.authorizationEndpoint}?${params.toString()}`
    };
  }
  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code, codeVerifier, redirectUri) {
    const uri = redirectUri ?? this.config.redirectUri;
    if (!uri) {
      throw new Error("Redirect URI is required");
    }
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: uri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code_verifier: codeVerifier
    });
    const response = await fetch(this.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: body.toString()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new AppHubOAuthError(
        error.error,
        error.error_description ?? "Token exchange failed"
      );
    }
    return response.json();
  }
  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken) {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    });
    const response = await fetch(this.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: body.toString()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new AppHubOAuthError(
        error.error,
        error.error_description ?? "Token refresh failed"
      );
    }
    return response.json();
  }
  /**
   * Fetch user info from AppHub
   */
  async getUserInfo(accessToken) {
    const response = await fetch(this.userInfoEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    if (!response.ok) {
      throw new AppHubOAuthError("user_info_error", "Failed to fetch user info");
    }
    return response.json();
  }
  /**
   * Revoke a token (access or refresh)
   */
  async revokeToken(token, tokenType = "access_token") {
    const baseUrl = this.config.hubUrl.replace(/\/$/, "");
    const revokeEndpoint = `${baseUrl}/oauth/revoke`;
    const body = new URLSearchParams({
      token,
      token_type_hint: tokenType,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    });
    const response = await fetch(revokeEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: body.toString()
    });
    if (!response.ok) {
      throw new AppHubOAuthError("revoke_error", "Failed to revoke token");
    }
  }
};
var AppHubOAuthError = class extends Error {
  constructor(code, message) {
    super(message);
    this.name = "AppHubOAuthError";
    this.code = code;
  }
};
function createOAuthClient(config) {
  return new AppHubOAuth(config);
}
var AppHubJWT = class {
  constructor(config) {
    this.publicKey = null;
    this.config = config;
    const baseUrl = config.hubUrl.replace(/\/$/, "");
    this.jwksUrl = `${baseUrl}/.well-known/jwks.json`;
  }
  /**
   * Initialize the validator with the public key
   * Call this once at startup for better performance
   */
  async initialize() {
    if (this.config.publicKey) {
      this.publicKey = await jose.importSPKI(this.config.publicKey, "RS256");
    }
  }
  /**
   * Get the public key for JWT verification
   */
  async getPublicKey() {
    if (this.publicKey) {
      return this.publicKey;
    }
    if (this.config.publicKey) {
      this.publicKey = await jose.importSPKI(this.config.publicKey, "RS256");
      return this.publicKey;
    }
    return jose.createRemoteJWKSet(new URL(this.jwksUrl));
  }
  /**
   * Validate a JWT access token
   */
  async validateToken(token, options = {}) {
    try {
      const key = await this.getPublicKey();
      const verifyOptions = {
        issuer: this.config.hubUrl.replace(/\/$/, ""),
        algorithms: ["RS256"]
      };
      if (!options.skipAudienceCheck) {
        verifyOptions.audience = this.config.appSlug;
      }
      const { payload } = await jose.jwtVerify(token, key, verifyOptions);
      const tokenPayload = payload;
      if (!options.skipLicenseCheck) {
        if (!tokenPayload.licensed_apps?.includes(this.config.appSlug)) {
          return {
            valid: false,
            error: `Entity is not licensed for app: ${this.config.appSlug}`
          };
        }
      }
      if (options.requiredClaims) {
        for (const claim of options.requiredClaims) {
          if (!(claim in tokenPayload)) {
            return {
              valid: false,
              error: `Missing required claim: ${claim}`
            };
          }
        }
      }
      return {
        valid: true,
        payload: tokenPayload
      };
    } catch (error) {
      if (error instanceof jose.errors.JWTExpired) {
        return { valid: false, error: "Token has expired" };
      }
      if (error instanceof jose.errors.JWTClaimValidationFailed) {
        return { valid: false, error: `Claim validation failed: ${error.message}` };
      }
      if (error instanceof jose.errors.JWSSignatureVerificationFailed) {
        return { valid: false, error: "Invalid token signature" };
      }
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Token validation failed"
      };
    }
  }
  /**
   * Validate and extract tenant context from token
   */
  async getTenantContext(token, options = {}) {
    const result = await this.validateToken(token, options);
    if (!result.valid || !result.payload) {
      throw new AppHubJWTError("invalid_token", result.error ?? "Invalid token");
    }
    const payload = result.payload;
    const user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      image: payload.image ?? null
    };
    const entity = {
      id: payload.entity_id,
      name: payload.entity_name,
      slug: payload.entity_slug
    };
    const scope = payload.scopes?.[this.config.appSlug] ?? null;
    return {
      user,
      entity,
      role: payload.role,
      permissions: payload.permissions ?? [],
      scope,
      isImpersonated: !!payload.impersonated_by,
      impersonatedBy: payload.impersonated_by,
      licensedApps: payload.licensed_apps ?? [],
      tokenPayload: payload
    };
  }
  /**
   * Decode a token without verification (for debugging)
   * WARNING: Never trust unverified tokens for authorization
   */
  decodeToken(token) {
    try {
      const decoded = jose.decodeJwt(token);
      return decoded;
    } catch {
      return null;
    }
  }
  /**
   * Check if a token is expired (without full validation)
   */
  isTokenExpired(token) {
    const decoded = this.decodeToken(token);
    if (!decoded?.exp) return true;
    return Date.now() >= decoded.exp * 1e3;
  }
  /**
   * Get time until token expires in seconds
   * Returns negative value if already expired
   */
  getTokenExpiresIn(token) {
    const decoded = this.decodeToken(token);
    if (!decoded?.exp) return -1;
    return Math.floor(decoded.exp - Date.now() / 1e3);
  }
};
var AppHubJWTError = class extends Error {
  constructor(code, message) {
    super(message);
    this.name = "AppHubJWTError";
    this.code = code;
  }
};
function createJWTValidator(config) {
  return new AppHubJWT(config);
}
function extractBearerToken(authHeader) {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }
  return parts[1];
}
function extractTokenFromRequest(req) {
  let authHeader = null;
  if (req.headers instanceof Headers) {
    authHeader = req.headers.get("authorization");
  } else {
    const header = req.headers["authorization"] ?? req.headers["Authorization"];
    authHeader = Array.isArray(header) ? header[0] : header ?? null;
  }
  return extractBearerToken(authHeader);
}

// src/api.ts
var AppHubApiClient = class {
  constructor(config) {
    this.serviceToken = null;
    this.config = config;
    this.baseUrl = `${config.hubUrl.replace(/\/$/, "")}/api/v1`;
  }
  /**
   * Set the service token for server-to-server API calls
   */
  setServiceToken(token) {
    this.serviceToken = token;
  }
  /**
   * Make an authenticated API request
   */
  async request(method, path, options) {
    const url = `${this.baseUrl}${path}`;
    const token = options?.token ?? this.serviceToken;
    const headers = {
      "Content-Type": "application/json",
      "X-App-ID": this.config.appSlug,
      ...options?.headers
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(url, {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : void 0
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: "unknown_error",
        message: "Request failed",
        statusCode: response.status
      }));
      throw new AppHubApiError(
        error.error ?? "api_error",
        error.message ?? "API request failed",
        response.status,
        error.details
      );
    }
    return response.json();
  }
  // ============================================================================
  // APP INFORMATION
  // ============================================================================
  /**
   * Get current app information
   */
  async getApp(token) {
    const response = await this.request(
      "GET",
      `/apps/${this.config.appSlug}`,
      { token }
    );
    return response.data;
  }
  // ============================================================================
  // PERMISSIONS
  // ============================================================================
  /**
   * Sync permissions with AppHub
   * This registers or updates all permissions for your app
   */
  async syncPermissions(permissions, token) {
    const response = await this.request(
      "POST",
      `/apps/${this.config.appSlug}/permissions/sync`,
      {
        body: { permissions },
        token
      }
    );
    return response.data;
  }
  /**
   * Get current permissions registered for the app
   */
  async getPermissions(token) {
    const response = await this.request(
      "GET",
      `/apps/${this.config.appSlug}/permissions`,
      { token }
    );
    return response.data;
  }
  // ============================================================================
  // SCOPE TYPES
  // ============================================================================
  /**
   * Sync scope types with AppHub
   */
  async syncScopeTypes(scopeTypes, token) {
    const response = await this.request(
      "POST",
      `/apps/${this.config.appSlug}/scope-types/sync`,
      {
        body: { scopeTypes },
        token
      }
    );
    return response.data;
  }
  /**
   * Get current scope types registered for the app
   */
  async getScopeTypes(token) {
    const response = await this.request(
      "GET",
      `/apps/${this.config.appSlug}/scope-types`,
      { token }
    );
    return response.data;
  }
  // ============================================================================
  // PLANS & LICENSING
  // ============================================================================
  /**
   * Get available plans for the app
   */
  async getPlans(token) {
    const response = await this.request(
      "GET",
      `/apps/${this.config.appSlug}/plans`,
      { token }
    );
    return response.data;
  }
  /**
   * Get license for a specific entity
   */
  async getLicense(entityId, token) {
    try {
      const response = await this.request(
        "GET",
        `/entities/${entityId}/licenses/${this.config.appSlug}`,
        { token }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AppHubApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }
  /**
   * Check if an entity is licensed for this app
   */
  async isLicensed(entityId, token) {
    const license = await this.getLicense(entityId, token);
    return license !== null && ["active", "trial"].includes(license.status);
  }
  // ============================================================================
  // SCOPE OPTIONS PROXY
  // ============================================================================
  /**
   * Provide scope options for AppHub to display
   * AppHub will call your optionsEndpoint and proxy through this
   */
  async getScopeOptions(scopeType, entityId, token) {
    const response = await this.request(
      "GET",
      `/apps/${this.config.appSlug}/scope-options/${scopeType}?entityId=${entityId}`,
      { token }
    );
    return response.data;
  }
  // ============================================================================
  // ENTITY INFORMATION
  // ============================================================================
  /**
   * Get entity information
   */
  async getEntity(entityId, token) {
    const response = await this.request(
      "GET",
      `/entities/${entityId}`,
      { token }
    );
    return response.data;
  }
  /**
   * Get entity members with their roles and permissions for this app
   */
  async getEntityMembers(entityId, token) {
    const response = await this.request(
      "GET",
      `/entities/${entityId}/members?appId=${this.config.appSlug}`,
      { token }
    );
    return response.data;
  }
  // ============================================================================
  // WEBHOOKS
  // ============================================================================
  /**
   * Test webhook connectivity (sends a test event)
   */
  async testWebhook(webhookId, token) {
    const response = await this.request(
      "POST",
      `/apps/${this.config.appSlug}/webhooks/${webhookId}/test`,
      { token }
    );
    return response.data;
  }
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  /**
   * Health check for AppHub connectivity
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.config.hubUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
  /**
   * Get AppHub public key for JWT verification
   */
  async getPublicKey() {
    const response = await fetch(`${this.baseUrl}/.well-known/jwks.json`);
    if (!response.ok) {
      throw new AppHubApiError("jwks_error", "Failed to fetch JWKS", response.status);
    }
    const jwks = await response.json();
    if (jwks.keys && jwks.keys.length > 0) {
      return JSON.stringify(jwks.keys[0]);
    }
    throw new AppHubApiError("jwks_error", "No keys found in JWKS", 404);
  }
};
var AppHubApiError = class extends Error {
  constructor(code, message, statusCode, details) {
    super(message);
    this.name = "AppHubApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
  /**
   * Check if error is a not found error
   */
  isNotFound() {
    return this.statusCode === 404;
  }
  /**
   * Check if error is an authorization error
   */
  isUnauthorized() {
    return this.statusCode === 401;
  }
  /**
   * Check if error is a forbidden error
   */
  isForbidden() {
    return this.statusCode === 403;
  }
};
function createApiClient(config) {
  return new AppHubApiClient(config);
}

// src/webhook.ts
async function computeHmacSha256(payload, secret) {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } else {
    const nodeCrypto = __require("crypto");
    return nodeCrypto.createHmac("sha256", secret).update(payload).digest("hex");
  }
}
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
async function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = await computeHmacSha256(payload, secret);
  const providedSignature = signature.startsWith("sha256=") ? signature.slice(7) : signature;
  return timingSafeEqual(expectedSignature, providedSignature);
}
async function parseWebhookRequest(payload, signature, secret) {
  const isValid = await verifyWebhookSignature(payload, signature, secret);
  if (!isValid) {
    throw new WebhookError("invalid_signature", "Invalid webhook signature");
  }
  try {
    const event = JSON.parse(payload);
    if (!event.id || !event.type || !event.timestamp) {
      throw new WebhookError("invalid_payload", "Missing required event fields");
    }
    return event;
  } catch (error) {
    if (error instanceof WebhookError) throw error;
    throw new WebhookError("parse_error", "Failed to parse webhook payload");
  }
}
var WebhookError = class extends Error {
  constructor(code, message) {
    super(message);
    this.name = "WebhookError";
    this.code = code;
  }
};
var WebhookProcessor = class {
  constructor(secret) {
    this.handlers = {};
    this.secret = secret;
  }
  /**
   * Register a handler for a specific event type
   */
  on(eventType, handler) {
    this.handlers[eventType] = handler;
    return this;
  }
  /**
   * Register a default handler for unhandled events
   */
  onDefault(handler) {
    this.defaultHandler = handler;
    return this;
  }
  /**
   * Register handlers for user events
   */
  onUserCreated(handler) {
    return this.on("user.created", handler);
  }
  onUserUpdated(handler) {
    return this.on("user.updated", handler);
  }
  onUserDeleted(handler) {
    return this.on("user.deleted", handler);
  }
  /**
   * Register handlers for membership events
   */
  onMembershipCreated(handler) {
    return this.on("membership.created", handler);
  }
  onMembershipUpdated(handler) {
    return this.on("membership.updated", handler);
  }
  onMembershipDeleted(handler) {
    return this.on("membership.deleted", handler);
  }
  /**
   * Register handlers for license events
   */
  onLicenseActivated(handler) {
    return this.on("license.activated", handler);
  }
  onLicenseSuspended(handler) {
    return this.on("license.suspended", handler);
  }
  onLicenseCancelled(handler) {
    return this.on("license.cancelled", handler);
  }
  /**
   * Process a webhook request
   */
  async process(payload, signature) {
    const event = await parseWebhookRequest(payload, signature, this.secret);
    const handler = this.handlers[event.type] ?? this.defaultHandler;
    if (handler) {
      await handler(event);
    }
    return event;
  }
  /**
   * Create a request handler for common frameworks
   */
  createHandler() {
    return async (req) => {
      try {
        let payload;
        if (typeof req.text === "function") {
          payload = await req.text();
        } else if (typeof req.body === "string") {
          payload = req.body;
        } else if (req.body) {
          payload = JSON.stringify(req.body);
        } else {
          throw new WebhookError("no_payload", "No request body");
        }
        let signature = null;
        if (req.headers instanceof Headers) {
          signature = req.headers.get("x-apphub-signature");
        } else {
          const header = req.headers["x-apphub-signature"] ?? req.headers["X-AppHub-Signature"];
          signature = Array.isArray(header) ? header[0] : header ?? null;
        }
        if (!signature) {
          throw new WebhookError("no_signature", "Missing X-AppHub-Signature header");
        }
        const event = await this.process(payload, signature);
        return { success: true, event };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    };
  }
};
function createWebhookProcessor(secret) {
  return new WebhookProcessor(secret);
}
function createNextJSWebhookHandler(options) {
  const processor = new WebhookProcessor(options.secret);
  for (const [eventType, handler] of Object.entries(options.handlers)) {
    if (handler) {
      processor.on(eventType, handler);
    }
  }
  return async function POST(request) {
    try {
      const payload = await request.text();
      const signature = request.headers.get("x-apphub-signature");
      if (!signature) {
        return Response.json(
          { error: "Missing signature" },
          { status: 401 }
        );
      }
      const event = await processor.process(payload, signature);
      return Response.json({ received: true, eventId: event.id });
    } catch (error) {
      if (options.onError && error instanceof Error) {
        options.onError(error);
      }
      if (error instanceof WebhookError) {
        if (error.code === "invalid_signature") {
          return Response.json({ error: error.message }, { status: 401 });
        }
        return Response.json({ error: error.message }, { status: 400 });
      }
      return Response.json({ error: "Internal error" }, { status: 500 });
    }
  };
}

// src/rbac.ts
var ROLE_HIERARCHY = {
  member: 1,
  manager: 2,
  admin: 3,
  owner: 4
};
function hasPermission(ctx, permission) {
  return ctx.permissions.includes(permission);
}
function hasAllPermissions(ctx, permissions) {
  return permissions.every((p) => ctx.permissions.includes(p));
}
function hasAnyPermission(ctx, permissions) {
  return permissions.some((p) => ctx.permissions.includes(p));
}
function hasRole(ctx, minimumRole) {
  const userLevel = ROLE_HIERARCHY[ctx.role] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 0;
  return userLevel >= requiredLevel;
}
function hasExactRole(ctx, role) {
  return ctx.role === role;
}
function isOwner(ctx) {
  return ctx.role === "owner";
}
function isAdmin(ctx) {
  return hasRole(ctx, "admin");
}
function isImpersonated(ctx) {
  return ctx.isImpersonated;
}
function parsePermission(permission) {
  const parts = permission.split(":");
  if (parts.length !== 2) {
    throw new Error(`Invalid permission format: ${permission}`);
  }
  return {
    resource: parts[0],
    action: parts[1]
  };
}
function buildPermission(resource, action) {
  return `${resource}:${action}`;
}
function getPermissionsForResource(ctx, resource) {
  return ctx.permissions.filter((p) => p.startsWith(`${resource}:`));
}
function canPerform(ctx, resource, action) {
  const permission = buildPermission(resource, action);
  return hasPermission(ctx, permission);
}
function canRead(ctx, resource) {
  return canPerform(ctx, resource, "read");
}
function canWrite(ctx, resource) {
  return canPerform(ctx, resource, "write");
}
function canDelete(ctx, resource) {
  return canPerform(ctx, resource, "delete");
}
function canManage(ctx, resource) {
  return canPerform(ctx, resource, "manage");
}
var AuthorizationError = class extends Error {
  constructor(message, options) {
    super(message);
    this.name = "AuthorizationError";
    this.code = "unauthorized";
    this.requiredPermission = options?.permission;
    this.requiredRole = options?.role;
  }
};
function requirePermission(ctx, permission) {
  if (!hasPermission(ctx, permission)) {
    throw new AuthorizationError(
      `Missing required permission: ${permission}`,
      { permission }
    );
  }
}
function requireAllPermissions(ctx, permissions) {
  const missing = permissions.filter((p) => !hasPermission(ctx, p));
  if (missing.length > 0) {
    throw new AuthorizationError(
      `Missing required permissions: ${missing.join(", ")}`,
      { permission: missing[0] }
    );
  }
}
function requireAnyPermission(ctx, permissions) {
  if (!hasAnyPermission(ctx, permissions)) {
    throw new AuthorizationError(
      `Requires one of: ${permissions.join(", ")}`,
      { permission: permissions[0] }
    );
  }
}
function requireRole(ctx, minimumRole) {
  if (!hasRole(ctx, minimumRole)) {
    throw new AuthorizationError(
      `Requires role: ${minimumRole} or higher`,
      { role: minimumRole }
    );
  }
}
function requireAdmin(ctx) {
  requireRole(ctx, "admin");
}
function requireOwner(ctx) {
  requireRole(ctx, "owner");
}
function definePermission(resource, action, options) {
  return {
    slug: buildPermission(resource, action),
    resource,
    action,
    ...options
  };
}
function defineCrudPermissions(resource, displayName, options) {
  const groupName = options?.groupName ?? displayName;
  const defaultActions = options?.defaultActions ?? ["read"];
  const permissions = [
    {
      slug: `${resource}:read`,
      name: `View ${displayName}`,
      description: `View ${displayName.toLowerCase()} list and details`,
      resource,
      action: "read",
      groupName,
      sortOrder: 0,
      isDefault: defaultActions.includes("read")
    },
    {
      slug: `${resource}:write`,
      name: `Edit ${displayName}`,
      description: `Create and update ${displayName.toLowerCase()}`,
      resource,
      action: "write",
      groupName,
      sortOrder: 1,
      isDefault: defaultActions.includes("write")
    },
    {
      slug: `${resource}:delete`,
      name: `Delete ${displayName}`,
      description: `Delete ${displayName.toLowerCase()}`,
      resource,
      action: "delete",
      groupName,
      sortOrder: 2,
      isDefault: defaultActions.includes("delete")
    }
  ];
  if (options?.includeManage) {
    permissions.push({
      slug: `${resource}:manage`,
      name: `Manage ${displayName}`,
      description: `Full management control over ${displayName.toLowerCase()}`,
      resource,
      action: "manage",
      groupName,
      sortOrder: 3
    });
  }
  if (options?.includeExport) {
    permissions.push({
      slug: `${resource}:export`,
      name: `Export ${displayName}`,
      description: `Export ${displayName.toLowerCase()} data`,
      resource,
      action: "export",
      groupName,
      sortOrder: 4
    });
  }
  return permissions;
}
function RequirePermission(permission) {
  return function(_target, _propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function(...args) {
      const ctx = this.ctx ?? args[0];
      requirePermission(ctx, permission);
      return originalMethod.apply(this, args);
    };
    return descriptor;
  };
}
function RequireRole(minimumRole) {
  return function(_target, _propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function(...args) {
      const ctx = this.ctx ?? args[0];
      requireRole(ctx, minimumRole);
      return originalMethod.apply(this, args);
    };
    return descriptor;
  };
}

// src/scope.ts
function applyScopeFilter(where, ctx, config = {}) {
  const result = { ...where };
  const entityField = config.entityId ?? "entityId";
  result[entityField] = ctx.entity.id;
  if (!ctx.scope || ctx.scope.type === "full_access") {
    return result;
  }
  const scope = ctx.scope;
  switch (scope.type) {
    case "customer":
      if (config.customer && scope.value?.customer_id) {
        result[config.customer] = scope.value.customer_id;
      }
      break;
    case "customers":
      if (config.customers && Array.isArray(scope.value?.customer_ids)) {
        result[config.customers] = {
          in: scope.value.customer_ids
        };
      }
      break;
    case "region":
      if (config.region && scope.value?.region) {
        result[config.region] = scope.value.region;
      }
      break;
    case "entity_ids":
      if (config.entityIds && Array.isArray(scope.value?.ids)) {
        result[config.entityIds] = {
          in: scope.value.ids
        };
      }
      break;
    default:
      if (scope.value && config.custom) {
        for (const [scopeKey, dbField] of Object.entries(config.custom)) {
          if (scopeKey in scope.value) {
            const scopeValue = scope.value[scopeKey];
            if (Array.isArray(scopeValue)) {
              result[dbField] = { in: scopeValue };
            } else {
              result[dbField] = scopeValue;
            }
          }
        }
      }
  }
  return result;
}
function createScopeFilter(config) {
  return (where, ctx) => {
    return applyScopeFilter(where, ctx, config);
  };
}
function hasAccessToRecord(record, ctx, config = {}) {
  const entityField = config.entityId ?? "entityId";
  if (record[entityField] !== ctx.entity.id) {
    return false;
  }
  if (!ctx.scope || ctx.scope.type === "full_access") {
    return true;
  }
  const scope = ctx.scope;
  switch (scope.type) {
    case "customer":
      if (config.customer && scope.value?.customer_id) {
        return record[config.customer] === scope.value.customer_id;
      }
      break;
    case "customers":
      if (config.customers && Array.isArray(scope.value?.customer_ids)) {
        const value = record[config.customers];
        return scope.value.customer_ids.includes(value);
      }
      break;
    case "region":
      if (config.region && scope.value?.region) {
        return record[config.region] === scope.value.region;
      }
      break;
    case "entity_ids":
      if (config.entityIds && Array.isArray(scope.value?.ids)) {
        const value = record[config.entityIds];
        return scope.value.ids.includes(value);
      }
      break;
    default:
      if (scope.value && config.custom) {
        for (const [scopeKey, dbField] of Object.entries(config.custom)) {
          if (scopeKey in scope.value) {
            const scopeValue = scope.value[scopeKey];
            const recordValue = record[dbField];
            if (Array.isArray(scopeValue)) {
              if (!scopeValue.includes(recordValue)) {
                return false;
              }
            } else if (recordValue !== scopeValue) {
              return false;
            }
          }
        }
      }
  }
  return true;
}
function filterRecordsByScope(records, ctx, config = {}) {
  return records.filter((record) => hasAccessToRecord(record, ctx, config));
}
function requireAccessToRecord(record, ctx, config = {}) {
  if (!hasAccessToRecord(record, ctx, config)) {
    throw new ScopeAccessError("Access denied to this record");
  }
}
var ScopeAccessError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ScopeAccessError";
    this.code = "scope_access_denied";
  }
};
function defineFullAccessScope() {
  return {
    slug: "full_access",
    name: "Full Access",
    description: "Access to all organization data without restrictions",
    requiresSelection: false,
    sortOrder: 0
  };
}
function defineCustomerScope(options) {
  return {
    slug: options?.multiSelect ? "customers" : "customer",
    name: options?.name ?? (options?.multiSelect ? "Customers" : "Customer"),
    description: options?.description ?? "Limit access to specific customer(s)",
    requiresSelection: true,
    multiSelect: options?.multiSelect ?? false,
    optionsEndpoint: options?.optionsEndpoint ?? "/api/v1/scope-options/customers",
    sortOrder: 1
  };
}
function defineRegionScope(options) {
  return {
    slug: "region",
    name: options?.name ?? "Region",
    description: options?.description ?? "Limit access to a geographic region",
    requiresSelection: true,
    multiSelect: false,
    optionsEndpoint: options?.optionsEndpoint ?? "/api/v1/scope-options/regions",
    sortOrder: 2
  };
}
function defineCustomScope(slug, options) {
  return {
    slug,
    ...options
  };
}
function getScopeType(ctx) {
  return ctx.scope?.type ?? null;
}
function getScopeValue(ctx) {
  return ctx.scope?.value ?? null;
}
function hasFullAccess(ctx) {
  return !ctx.scope || ctx.scope.type === "full_access";
}
function hasScopeType(ctx, scopeType) {
  return ctx.scope?.type === scopeType;
}
function buildScopeOptionsResponse(items) {
  return { data: items };
}

// src/index.ts
function createAppHubClient(config) {
  const client = {
    oauth: createOAuthClient(config),
    jwt: createJWTValidator(config),
    api: createApiClient(config),
    config
  };
  if (config.webhookSecret) {
    client.webhooks = createWebhookProcessor(config.webhookSecret);
  }
  return client;
}
var SDK_VERSION = "1.0.0";
var src_default = createAppHubClient;

export { AppHubApiClient, AppHubApiError, AppHubJWT, AppHubJWTError, AppHubOAuth, AppHubOAuthError, AuthorizationError, RequirePermission, RequireRole, SDK_VERSION, ScopeAccessError, WebhookError, WebhookProcessor, applyScopeFilter, buildPermission, buildScopeOptionsResponse, canDelete, canManage, canPerform, canRead, canWrite, createApiClient, createAppHubClient, createJWTValidator, createNextJSWebhookHandler, createOAuthClient, createScopeFilter, createWebhookProcessor, src_default as default, defineCrudPermissions, defineCustomScope, defineCustomerScope, defineFullAccessScope, definePermission, defineRegionScope, extractBearerToken, extractTokenFromRequest, filterRecordsByScope, getPermissionsForResource, getScopeType, getScopeValue, hasAccessToRecord, hasAllPermissions, hasAnyPermission, hasExactRole, hasFullAccess, hasPermission, hasRole, hasScopeType, isAdmin, isImpersonated, isOwner, parsePermission, parseWebhookRequest, requireAccessToRecord, requireAdmin, requireAllPermissions, requireAnyPermission, requireOwner, requirePermission, requireRole, verifyWebhookSignature };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map