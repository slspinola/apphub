/**
 * API Authentication Helper
 * Handles authentication for API endpoints that may be called from external apps
 */

import { auth } from '@/auth'
import { NextRequest } from 'next/server'

export async function getAPISession(request?: NextRequest) {
  // First, try to get session from NextAuth (same-app requests)
  const session = await auth()

  if (session) {
    return session
  }

  // For cross-app requests (e.g., from Bee2App), we could validate Bearer tokens here
  // For now, during development on localhost, we'll allow requests without session
  // This is a development-only convenience - in production, proper token validation should be implemented

  if (process.env.NODE_ENV === 'development') {
    // Allow development requests - return a mock session structure
    // This will be replaced with proper Bearer token validation in production
    return null
  }

  return null
}
