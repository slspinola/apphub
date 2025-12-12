/**
 * POST /api/permissions/check
 * Check if a user has a specific permission in an entity
 */

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Note: This API endpoint is designed to be called by integrated apps (like Bee2App)
    // In development, we skip strict session validation since cross-app requests won't share cookies
    // The userId from the request body is trusted in development
    // TODO: In production, implement proper API key or Bearer token validation

    const body = await request.json()
    const { userId, entityId, permission } = body

    console.log('🔍 [APPHUB] Permission check request:', { userId, entityId, permission })

    if (!userId || !entityId || !permission) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, entityId, permission' },
        { status: 400 }
      )
    }

    // Verify prisma is initialized
    if (!prisma) {
      console.error('Prisma client is not initialized')
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      )
    }

    // Get user's role in the entity
    const membership = await prisma.membership.findUnique({
      where: {
        userId_entityId: {
          userId,
          entityId
        }
      }
    })

    console.log('🔍 [APPHUB] Membership found:', membership)

    if (!membership) {
      console.log('🔍 [APPHUB] No membership found - returning false')
      return NextResponse.json({ hasPermission: false })
    }

    // For now, implement simple role-based permissions
    // ADMIN and OWNER have all permissions
    // MANAGER has most permissions except critical ones
    // MEMBER has basic permissions

    const rolePermissions: Record<string, string[]> = {
      OWNER: ['*'], // All permissions
      ADMIN: ['*'], // All permissions
      MANAGER: [
        'create_work_orders',
        'edit_work_orders',
        'view_work_orders',
        'assign_work_orders',
        'delete_work_orders',
        'manage_categories'
      ],
      MEMBER: ['create_work_orders', 'view_work_orders', 'edit_own_work_orders']
    }

    const userRole = (membership.role as string).toUpperCase()
    const allowedPermissions = rolePermissions[userRole] || []

    console.log('🔍 [APPHUB] Role check:', {
      originalRole: membership.role,
      upperRole: userRole,
      allowedPermissions,
      requestedPermission: permission
    })

    // Check if user has permission
    const hasPermission =
      allowedPermissions.includes('*') || allowedPermissions.includes(permission)

    console.log('🔍 [APPHUB] Final decision:', hasPermission)

    return NextResponse.json({ hasPermission })
  } catch (error) {
    console.error('Error in /api/permissions/check:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
