# Session Validation Testing Guide

## Overview
This document provides instructions for testing the session validation fix that prevents foreign key constraint violations when users have stale JWT tokens.

## What Was Fixed
- **Problem**: Users with valid JWT tokens but deleted database records caused `Foreign key constraint violated: Membership_userId_fkey` errors
- **Solution**: Added middleware to validate session users exist in database before processing requests
- **Behavior**: Users with invalid sessions are automatically logged out and redirected to login

## Automated Tests
The validation logic has been tested with the following scenarios:
- ✅ Null session returns false
- ✅ Session without user ID returns false  
- ✅ Session with non-existent user ID returns false

## Manual Testing Steps

### Test 1: Valid Session (Normal Flow)
1. Start the development server: `npm run dev`
2. Navigate to http://localhost:3000
3. Log in with valid credentials
4. Create a new entity
5. **Expected**: Entity creates successfully without errors

### Test 2: Invalid Session (Stale JWT)
This test simulates a user whose database record was deleted but still has a valid JWT.

#### Option A: Using Database Manipulation
1. Log in to the application
2. Note your user ID from the session (check browser dev tools → Application → Cookies → authjs.session-token)
3. Open your database client (e.g., Prisma Studio: `npx prisma studio`)
4. Delete your user record from the User table
5. Refresh any page in the application
6. **Expected**: 
   - Redirected to `/login?error=SessionExpired&message=Your session has expired. Please log in again.`
   - Red alert box displays: "Your session has expired. Please log in again."
   - Session cookies are cleared

#### Option B: Using Different Database
1. Log in to the application with the current database
2. Switch to a different database (update DATABASE_URL in .env)
3. Run migrations: `npx prisma migrate deploy`
4. Refresh any page in the application (don't log out)
5. **Expected**: Same as Option A

### Test 3: Entity Creation with Invalid Session
1. Follow Test 2 to get an invalid session state
2. Try to create an entity (if you can access the form before redirect)
3. **Expected**:
   - Middleware should catch and redirect before action executes
   - If action somehow executes, error message: "Your session is invalid. Please log out and log in again."

### Test 4: Public Routes Still Accessible
1. Log out or clear cookies
2. Navigate to public routes:
   - `/login`
   - `/register`
   - `/forgot-password`
3. **Expected**: All public routes accessible without validation

## Implementation Details

### Files Modified
1. **src/lib/auth-utils.ts** (new)
   - `validateSessionUser()` - Checks if session user exists in database

2. **src/middleware.ts**
   - Added session validation for protected routes
   - Clears session and redirects to login on invalid user
   - Skips validation for public paths

3. **src/features/entities/actions.ts**
   - Added specific error handling for foreign key constraint violations
   - Provides user-friendly error messages

4. **src/components/forms/login-form.tsx**
   - Added support for displaying session expiration messages
   - Shows alert when redirected with error=SessionExpired

5. **src/components/ui/alert.tsx** (new)
   - Alert component for displaying session expiration messages

### Middleware Flow
```
Request → Middleware
  ↓
Is public path? → Yes → Allow
  ↓ No
Has session? → No → Allow (auth will handle)
  ↓ Yes
User exists in DB? → Yes → Allow
  ↓ No
Clear session → Redirect to /login?error=SessionExpired
```

### Error Handling Flow
```
createEntity action
  ↓
Create entity with membership
  ↓
Foreign key error? → Yes → Check if Membership_userId_fkey
  ↓ Yes
Return error: "Your session is invalid. Please log out and log in again."
```

## Monitoring

### Server Logs
When a stale session is detected, you'll see:
```
Session user {userId} not found in database - forcing logout
```

### Database Queries
The middleware makes one lightweight query per request:
```sql
SELECT "id" FROM "User" WHERE "id" = $1 LIMIT 1
```

## Performance Considerations
- Query is lightweight (only selects ID)
- Only runs on protected routes
- Cached by Prisma client
- Skipped for public paths and API routes

## Troubleshooting

### Issue: Infinite redirect loop
**Cause**: Session validation failing repeatedly
**Solution**: Clear all cookies and try logging in again

### Issue: Still getting foreign key errors
**Cause**: Race condition or middleware not catching request
**Solution**: 
1. Check middleware matcher pattern
2. Verify route is not excluded
3. Check server logs for validation warnings

### Issue: Can't access public routes
**Cause**: Public paths not properly configured
**Solution**: Verify path is in publicPaths array in middleware.ts

## Next Steps
1. Monitor production logs for stale session occurrences
2. Consider adding session refresh mechanism
3. Add telemetry to track validation failures
4. Consider implementing graceful session recovery

## Rollback Plan
If issues arise:
1. Revert `src/middleware.ts` to previous version
2. Keep error handling in `src/features/entities/actions.ts`
3. This will allow graceful degradation with error messages

