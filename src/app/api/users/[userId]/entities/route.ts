/**
 * GET /api/users/:userId/entities
 * Returns all entities a user belongs to
 */

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Note: This API endpoint is designed to be called by integrated apps (like Bee2App)
    // In development, we skip strict session validation since cross-app requests won't share cookies
    // TODO: In production, implement proper API key or Bearer token validation

    const { userId } = await params

    // Get all entities where user is a member
    const entityMemberships = await prisma.membership.findMany({
      where: { userId },
      include: {
        entity: {
          include: {
            _count: {
              select: {
                memberships: true,
                children: true
              }
            }
          }
        }
      }
    })

    const entities = entityMemberships.map(em => ({
      ...em.entity,
      userRole: em.role
    }))

    return NextResponse.json(entities)
  } catch (error) {
    console.error('Error in /api/users/[userId]/entities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
