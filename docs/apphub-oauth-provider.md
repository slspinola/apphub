## AppHub OAuth Provider – Architecture & Flow

This document explains how the AppHub OAuth 2.0 / OpenID Connect provider works internally: data models, endpoints, JWTs, PKCE, and how client apps (like `hubapp`) use it.

---

## 1. High-Level Overview

- **Role of AppHub**: Acts as a **central OAuth 2.0 + OpenID Connect Provider** for ecosystem apps.
- **Role of client apps**: Use **Authorization Code Flow with PKCE** to authenticate users against AppHub.
- **Tokens issued by AppHub**:
  - **Authorization codes** (short‑lived, single-use)
  - **Access tokens** (JWTs with full RBAC and tenant info)
  - **Refresh tokens** (for silent renewal)
  - **ID tokens** (for OIDC user identity)

### 1.1 High-Level Architecture

```text
+----------------------------+
|          AppHub            |
| (OAuth 2.0 / OIDC Provider)|
+----------------------------+
| Users / Entities / RBAC    |
| Prisma + Next.js backend   |
|                            |
| OAuth Provider:            |
|  - /oauth/authorize        |
|  - /oauth/token            |
|  - /oauth/userinfo         |
|  - /oauth/revoke           |
|  - /.well-known/*          |
+-------------+--------------+
              |
              | OAuth2 / OIDC
              v
      +------------------+
      |   Client App     |
      |  (e.g. hubapp)   |
      | Next.js + Auth   |
      +------------------+
```

---

## 2. Core Data Models (Prisma)

These live in `prisma/schema.prisma`.

### 2.1 `OAuthClient`

- **Purpose**: Configuration for each client app (like `hubapp`).
- **Key fields**:
  - **clientId**: Public identifier used by the app.
  - **clientSecret**: Hashed secret used for backend-to-backend calls.
  - **redirectUris**: Allowed callback URLs.
  - **scopes**: Allowed scopes (e.g. `openid`, `profile`, `email`, `organization`).
  - **grantTypes**: `authorization_code`, `refresh_token`.
  - **tokenLifetime**: Access token lifetime (seconds).
  - **refreshTokenLifetime**: Refresh token lifetime (seconds).

### 2.2 `OAuthAuthorizationCode`

- **Purpose**: Temporary code used in the authorization code flow.
- **Key fields**:
  - **code**: Random secure code.
  - **clientId**: OAuth client that requested it.
  - **userId**: User who approved.
  - **redirectUri**: Must match on token exchange.
  - **scope**: Space‑separated scopes.
  - **codeChallenge / codeChallengeMethod**: PKCE support.
  - **expiresAt / usedAt**: Short‑lived and single‑use.

### 2.3 `OAuthRefreshToken`

- **Purpose**: Long‑lived token for refreshing access tokens.
- **Key fields**:
  - **token**: Random secure value (e.g. `rt_...`).
  - **clientId / userId**.
  - **scope**.
  - **expiresAt**.
  - **revokedAt**: Null unless revoked.

These models are related to `User` and `OAuthClient` for full traceability.

---

## 3. JWT Infrastructure

Implemented in `src/lib/oauth/jwt.ts`.

### 3.1 Key Management

- **Primary source**: Environment variables
  - `OAUTH_JWT_PRIVATE_KEY` – PEM-encoded private key (PKCS#8)
  - `OAUTH_JWT_PUBLIC_KEY` – PEM-encoded public key (SPKI)
  - `OAUTH_JWT_KEY_ID` – Key ID used in JWK (`kid`)
- **Fallback (dev only)**: If keys are not provided, AppHub generates a **temporary RSA keypair** at startup.

### 3.2 Issuer (`iss`)

- Determined by:
  - `NEXTAUTH_URL`, or
  - `NEXT_PUBLIC_APP_URL`, or
  - Defaults to `http://localhost:3000` for local dev.

### 3.3 Access Token Claims (summary)

The access token is a JWT with claims similar to:

```json
{
  "iss": "https://hub.example.com",
  "sub": "user_abc123",
  "aud": ["myapp"],
  "exp": 1699999999,
  "iat": 1699996399,
  "jti": "token_xyz789",

  "email": "user@example.com",
  "name": "John Doe",
  "image": "https://.../avatar.jpg",

  "entity_id": "entity_org123",
  "entity_name": "Acme Corp",
  "entity_slug": "acme-corp",

  "role": "admin",
  "permissions": ["vehicles:read", "vehicles:write", ...],
  "scopes": {
    "myapp": {
      "type": "customer",
      "value": { "customer_id": "cust_123" }
    }
  },

  "licensed_apps": ["myapp", "other-app"],
  "impersonated_by": null
}
```

### 3.4 ID Token Claims (summary)

- Standard OIDC identity claims:
  - `sub`, `aud`, `email`, `email_verified`, `name`, `picture`.
  - AppHub extensions: `entity_id`, `entity_name`, `entity_slug`, `role`.

---

## 4. PKCE Utilities

Implemented in `src/lib/oauth/pkce.ts`.

- **generateCodeVerifier()**: Creates a high-entropy random verifier (`base64url`).
- **generateCodeChallenge(verifier)**: Computes `S256` challenge (SHA-256 + base64url).
- **verifyCodeChallenge(verifier, challenge, method)**: Validates verifier against stored challenge.
- **isValidCodeChallengeMethod(method)**: Ensures method is `S256` or `plain`.

PKCE is **required** for all authorization flows.

---

## 5. Token Utilities

Implemented in `src/lib/oauth/tokens.ts`.

### 5.1 Authorization Codes

- **createAuthorizationCode(params)**:
  - Generates a secure code.
  - Stores code with `clientId`, `userId`, `redirectUri`, `scope`, PKCE fields, and expiry (10 minutes).
- **consumeAuthorizationCode(code)**:
  - Loads the code from DB.
  - Validates:
    - Not expired.
    - Not previously used.
  - Marks it as used (`usedAt`) to prevent replay.
  - Returns the full record for downstream checks (client ID, redirect URI, scope, PKCE data).

### 5.2 Refresh Tokens

- **createRefreshToken(clientId, userId, scope, expiresInSeconds)**:
  - Generates a secure `rt_...` token.
  - Stores it with expiry and client/user/scope info.
- **validateRefreshToken(token)**:
  - Ensures token exists and is not revoked or expired.
  - Implements **refresh token rotation** by revoking the used token.

### 5.3 Token Response Generation

- **generateTokenResponse(params)** / **generateTokens(...)**:
  - Build access token claims from:
    - `User` (id, email, name, image).
    - `Membership` / `Entity` (id, name, slug, role).
    - `OAuthClient` / `App` (app slug).
    - Permissions for the app.
    - Licensed apps for the entity.
    - App-specific scope (from `MembershipScope`).
  - Sign **access token** and (if `openid` scope) an **ID token**.
  - Create and store a **refresh token**.
  - Return OIDC-compatible JSON:

```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "rt_...",
  "id_token": "...",
  "scope": "openid profile email organization"
}
```

### 5.4 Revocation Helpers

- **revokeRefreshToken(token)**: Marks a refresh token as revoked.
- **revokeRefreshTokenForClient(token, clientId)**: Revokes only if owned by the given client.
- **revokeAllUserTokens(userId, clientId)**: Revokes all refresh tokens for a given user/client pair.

---

## 6. OAuth / OIDC Endpoints

All implemented under `src/app/` using Next.js route handlers.

### 6.1 GET `/oauth/authorize` – Authorization Endpoint

**File**: `src/app/oauth/authorize/route.ts`

**Responsibilities**:

- Parse and validate required query parameters:
  - **client_id**, **redirect_uri**, **response_type**, **scope**, **state**, **code_challenge**, **code_challenge_method**.
- Validate:
  - `response_type === "code"`.
  - `client_id` belongs to a known `OAuthClient`.
  - `redirect_uri` is in `client.redirectUris`.
  - Requested scopes are ⊆ `client.scopes`.
  - PKCE challenge + method are valid.
- Ensure the **user is authenticated** using `auth()`:
  - If not, redirect to `/login?callbackUrl=<original authorize URL>`.
- Load user’s **entity membership** and **license**:
  - Ensure the user has at least one `Membership`.
  - Ensure the entity has an `ACTIVE` or `TRIAL` `License` for this app.
- Create an **authorization code** with all context (client, user, redirect URI, scope, PKCE) via `createAuthorizationCode`.
- Redirect back to the client’s `redirect_uri` with:
  - `code=<authorization_code>`.
  - `state=<original_state>` (if present).

**Sequence diagram**:

```text
Client Browser                Client App                 AppHub
     |                           |                        |
     | 1. Navigate to app        |                        |
     |-------------------------->|                        |
     |                           | 2. Redirect to        |
     |                           |    /oauth/authorize   |
     |<--------------------------|                        |
     | 3. GET /oauth/authorize?client_id=...&...         |
     |-------------------------------------------------->|
     |                           | 4. Validate client,   |
     |                           |    scopes, PKCE, ...  |
     |                           | 5. Check user session |
     |                           | 6. Check license      |
     |                           | 7. Store auth code    |
     |                           | 8. Redirect to        |
     |<--------------------------------------------------|
     |   redirect_uri?code=...&state=...                 |
```

### 6.2 `src/app/oauth/authorize/page.tsx` – Consent UI

**File**: `src/app/oauth/authorize/page.tsx`

- Renders a **consent screen** describing what the app will access.
- Current behavior:
  - Mostly prepared for future external apps; internal apps are auto-approved in `route.ts`.
  - Validates presence of `client_id` and `redirect_uri`.
  - Loads the `OAuthClient` and displays:
    - App name and icon.
    - Descriptions of requested scopes (profile, email, organization, etc.).
  - Shows **“Allow”** and **“Deny”** actions:
    - **Deny**: redirect back to `redirect_uri` with `error=access_denied`.
    - **Allow**: submits back to `/oauth/authorize` with all parameters, so the route handler can generate the code and redirect.

This keeps the **logic** (validation, code creation) in the route, and the **UX** (what the user sees) in the page component.

---

### 6.3 POST `/oauth/token` – Token Endpoint

**File**: `src/app/oauth/token/route.ts`

Supports two grant types:

- **authorization_code**
- **refresh_token**

The handler accepts both `application/x-www-form-urlencoded` and JSON bodies.

#### 6.3.1 Authorization Code Grant (`grant_type=authorization_code`)

**Parameters**:

- `grant_type=authorization_code`
- `code` – authorization code from `/oauth/authorize`.
- `redirect_uri` – must match exactly.
- `client_id`.
- `client_secret`.
- `code_verifier` – PKCE verifier.

**Steps**:

1. **Validate client credentials**:
   - Load `OAuthClient` by `client_id`.
   - Verify `client_secret` using `verifySecret` from `src/lib/apps/oauth.ts`.
2. **Consume authorization code**:
   - Use `consumeAuthorizationCode(code)`.
   - Ensure code exists, not expired, and not used.
   - Ensure `redirect_uri` and `client_id` match the stored record.
3. **Validate PKCE**:
   - If stored `codeChallenge` is present, recompute using `code_verifier` and compare.
4. **Build user context**:
   - Load `User` and the relevant `Membership` + `Entity`.
   - Load `OAuthClient` + `App` permissions.
   - Load entity `License` records to compute `licensed_apps`.
5. **Generate tokens**:
   - Call `generateTokenResponse(...)` / `generateTokens(...)`.
   - Issue access token (JWT), refresh token, and ID token (if `openid` scope).
6. **Return JSON** with tokens and cache-control headers set to `no-store`.

#### 6.3.2 Refresh Token Grant (`grant_type=refresh_token`)

**Parameters**:

- `grant_type=refresh_token`
- `refresh_token`.
- `client_id`.
- `client_secret`.

**Steps**:

1. Validate client credentials.
2. Validate and rotate refresh token via `validateRefreshToken(refresh_token)`.
3. Load user + membership + entity + permissions + licenses.
4. Call `generateTokenResponse(...)` to issue **new** access + refresh + id tokens.
5. Return JSON with new tokens.

**Sequence diagram – token exchange**:

```text
Client App (backend)          AppHub
        |                       |
        | POST /oauth/token     |
        | grant_type=code       |
        | code=...              |
        | redirect_uri=...      |
        | client_id,secret,...  |
        |---------------------->|
        |                       |
        | 1. Validate client    |
        | 2. Consume auth code  |
        | 3. Validate PKCE      |
        | 4. Build claims       |
        | 5. Issue tokens       |
        |<----------------------|
        | {access_token,...}    |
```

---

### 6.4 GET `/oauth/userinfo` – UserInfo Endpoint

**File**: `src/app/oauth/userinfo/route.ts`

**Responsibilities**:

- Accepts **Bearer access token** in the `Authorization` header.
- Validates token via `verifyAccessToken` from `jwt.ts`.
- Parses the `scope` claim to decide which claims to return:
  - If `profile` in scope: include `name`, `picture`.
  - If `email` in scope: include `email` and compute `email_verified` from DB.
  - If `organization` in scope: include `entity_id`, `entity_name`, `entity_slug`, `role`.
- Returns a JSON object containing a subset of the access token claims.

Also supports `POST` as an alias to `GET` for compatibility.

---

### 6.5 POST `/oauth/revoke` – Token Revocation Endpoint

**File**: `src/app/oauth/revoke/route.ts`

**Parameters**:

- `token` – token to revoke (usually a refresh token).
- `token_type_hint` – optional (`refresh_token`).
- `client_id`, `client_secret` – to authenticate the caller.

**Behavior**:

1. Validate presence of `token`.
2. Validate client credentials using `OAuthClient` and `verifySecret`.
3. If token looks like a refresh token (starts with `rt_`) or `token_type_hint === 'refresh_token'`:
   - Call `revokeRefreshToken(token)`.
4. Always return **HTTP 200** per RFC 7009, even if the token was already invalid or missing.

Access tokens are **JWTs** and are not stored; they are not revoked directly and instead just expire naturally.

---

### 6.6 OIDC Discovery + JWKS

#### 6.6.1 GET `/.well-known/openid-configuration`

**File**: `src/app/.well-known/openid-configuration/route.ts`

- Returns the standard OIDC discovery document, including:
  - `issuer`.
  - `authorization_endpoint`.
  - `token_endpoint`.
  - `userinfo_endpoint`.
  - `jwks_uri`.
  - Supported `scopes`, `response_types`, `grant_types`, `code_challenge_methods`, etc.

Client libraries (e.g. NextAuth OIDC provider) use this to auto-configure endpoints and capabilities.

#### 6.6.2 GET `/.well-known/jwks.json`

**File**: `src/app/.well-known/jwks.json/route.ts`

- Uses `getJWKS()` from `jwt.ts`.
- Returns a JSON Web Key Set with AppHub's **public key** and associated metadata:
  - `kty`, `n`, `e`, `alg`, `kid`, `use`, etc.

Client apps fetch this to verify signatures on AppHub-issued JWTs.

---

## 7. End-to-End Authorization Code Flow

Below is the complete Authorization Code + PKCE flow between a client app and AppHub.

```text
User                Client App (hubapp)           AppHub (Provider)
 |                           |                          |
 | 1. Open /protected        |                          |
 |-------------------------->|                          |
 |                           | 2. If no session:        |
 |                           |    - Generate code_verifier
 |                           |    - Derive code_challenge
 |                           |    - Build /oauth/authorize URL
 |                           | 3. Redirect user         |
 |<--------------------------|                          |
 | 4. GET /oauth/authorize                         |
 |    ?client_id=...&...                            |
 |------------------------------------------------->|
 |                           | 5. Validate inputs      |
 |                           | 6. Check user login     |
 |                           | 7. Check license        |
 |                           | 8. Store auth code      |
 |                           | 9. Redirect to          |
 |<-------------------------------------------------|
 |   redirect_uri?code=...&state=...                |
 |-------------------------->|                          |
 |                           | 10. Backend calls       |
 |                           |     POST /oauth/token   |
 |                           |     grant_type=code     |
 |                           |     code=...            |
 |                           |     client_id,secret    |
 |                           |     code_verifier       |
 |                           |------------------------>|
 |                           | 11. Validate client     |
 |                           | 12. Consume auth code   |
 |                           | 13. Validate PKCE       |
 |                           | 14. Build claims        |
 |                           | 15. Issue tokens        |
 |                           |<------------------------|
 |                           | 16. Store tokens /      |
 |                           |     create session      |
 |                           | 17. Serve protected     |
 |<--------------------------|     content             |
```

### 7.1 Token Refresh (Refresh Token Grant)

```text
Client App (backend)           AppHub
        |                        |
        | POST /oauth/token      |
        | grant_type=refresh     |
        | refresh_token=...      |
        | client_id,secret       |
        |----------------------->|
        | 1. Validate client     |
        | 2. Validate & rotate   |
        |    refresh token       |
        | 3. Build claims        |
        | 4. Issue new tokens    |
        |<-----------------------|
        | {access_token,...}     |
```

---

## 8. Client Integration (e.g. `hubapp` with NextAuth)

Client apps (like `hubapp`) typically use NextAuth with an OIDC provider:

- **type**: `oidc`.
- **issuer**: AppHub base URL (e.g. `https://hub.example.com`).
- **clientId / clientSecret**: Values from `OAuthClient`.
- **authorization params**: `scope="openid profile email organization"`.

NextAuth will:

- Discover endpoints via `/.well-known/openid-configuration`.
- Use `/oauth/authorize` and `/oauth/token` automatically.
- Manage sessions and token refresh on the client side.
- Expose AppHub claims (entity, role, permissions, scopes) in the app session.

---

## 9. Environment Variables

For production deployments:

- **JWT keys** (recommended):

```env
OAUTH_JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
OAUTH_JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
OAUTH_JWT_KEY_ID="apphub-key-1"
```

- **URLs** (for correct `iss` in tokens and discovery):

```env
NEXTAUTH_URL=https://hub.example.com
NEXT_PUBLIC_APP_URL=https://hub.example.com
```

If the JWT keys are not provided, AppHub will generate a temporary keypair in memory (suitable for local development but **not** recommended for production).
