# Authentication Redirect Fix

## Issue
Unauthenticated users were not being redirected to the login page when accessing protected routes. The application would stay on the protected route instead of redirecting to `/login`.

## Root Cause

**Primary Issue**: JWT Secret Mismatch
- The `AUTH_SECRET` in `.env` was recently changed
- Old JWT session cookies were encrypted with the previous secret
- NextAuth couldn't decrypt these cookies, causing `JWTSessionError: no matching decryption secret`
- This resulted in failed authentication and prevented proper session handling

**Secondary Issue**: Middleware Redirect Logic
- The middleware was returning `NextResponse.next()` when no session was detected
- When using NextAuth v5's `auth()` wrapper with a custom middleware function, the `authorized` callback doesn't automatically redirect
- Our custom middleware needed to explicitly handle the redirect for unauthenticated users

## Solution

### Step 1: Clear Stale JWT Cookies
Navigate to `/api/auth/clear-session` to clear old session cookies encrypted with the previous `AUTH_SECRET`.

### Step 2: Fix Middleware Redirect Logic
Updated `src/middleware.ts` to explicitly redirect unauthenticated users:

```typescript
// AFTER (Fixed)
// Skip validation for public paths
if (isPublicPath) {
    return NextResponse.next()
}

// For protected routes without a session, redirect to login
if (!session) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
}
```

**Key Changes:**
1. **Added missing public routes** - `/oauth/*`, `/invite/*`, `/.well-known/*`, `/api/*`
2. **Explicit redirect for unauthenticated users** - No longer relying on NextAuth's `authorized` callback
3. **Separated public path handling** - Only return early for truly public paths

#### 2. `src/auth.config.ts`
- Added missing public routes to the `authorized` callback
- Improved comments for clarity

## How It Works Now

### Flow for Unauthenticated User Accessing Protected Route:
1. User visits `/dashboard` (protected route)
2. Middleware checks if path is public → No
3. Middleware checks if session exists → No
4. Middleware returns `NextResponse.next()` → **Passes control to NextAuth**
5. NextAuth's `authorized` callback executes
6. `authorized` callback checks `isLoggedIn` → `false`
7. `authorized` callback returns `false`
8. **NextAuth automatically redirects to `/login`** (configured in `pages.signIn`)

### Flow for Authenticated User:
1. User visits `/dashboard` (protected route)
2. Middleware checks if path is public → No
3. Middleware checks if session exists → Yes
4. Middleware validates user exists in database → Yes
5. Middleware returns `NextResponse.next()` → Request proceeds
6. User sees the dashboard

### Flow for Public Routes:
1. User visits `/login` or `/oauth/authorize`
2. Middleware checks if path is public → Yes
3. Middleware returns `NextResponse.next()` immediately
4. No authentication required

## Public Routes
The following routes are accessible without authentication:
- `/login` - Login page
- `/register` - Registration page
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset form
- `/verify-email` - Email verification
- `/resend-verification` - Resend verification email
- `/invite/*` - Invitation acceptance
- `/oauth/*` - OAuth authorization endpoints
- `/api/*` - API routes (some may have their own auth)
- `/.well-known/*` - OpenID Connect discovery

## Testing

### Automated Testing Performed
✅ Tested unauthenticated access to `/` → Redirected to `/login`  
✅ Tested unauthenticated access to `/my-apps` → Redirected to `/login`  
✅ Verified no JWT decryption errors after clearing cookies  
✅ Confirmed login page loads correctly without errors

### Manual Testing Steps
1. **Clear stale cookies:**
   ```
   Navigate to: http://localhost:3000/api/auth/clear-session
   ```

2. **Test unauthenticated access:**
   - Navigate to `http://localhost:3000/` or `http://localhost:3000/my-apps`
   - Expected: Redirect to `/login` ✅

3. **Test authenticated access:**
   - Log in with valid credentials
   - Navigate to protected routes
   - Expected: Access granted to protected content

4. **Test public routes:**
   - Navigate to `http://localhost:3000/login` without authentication
   - Expected: Login page loads (no redirect) ✅

### Known Issues
- React hydration warnings in console (non-critical, UI-related)
- These warnings don't affect authentication functionality

## Related Files
- `src/middleware.ts` - Main middleware with authentication logic
- `src/auth.config.ts` - NextAuth configuration with `authorized` callback
- `src/auth.ts` - NextAuth setup with providers and JWT callbacks
- `src/lib/auth-utils.ts` - Session validation utilities

## References
- NextAuth v5 Documentation: https://authjs.dev/getting-started/migrating-to-v5
- NextAuth Middleware: https://authjs.dev/guides/middleware

