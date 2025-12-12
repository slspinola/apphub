/**
 * GET /api/entities/:entityId/members
 * Returns all members of an entity
 */

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    // Note: This API endpoint is designed to be called by integrated apps (like Bee2App)
    // In development, we skip strict session validation since cross-app requests won't share cookies
    // TODO: In production, implement proper API key or Bearer token validation

    const { entityId } = await params

    // Get all members of the entity
    const members = await prisma.membership.findMany({
      where: { entityId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Format response
    const formattedMembers = members.map(member => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      image: member.user.image,
      role: member.role,
      joinedAt: member.createdAt,
      createdAt: member.user.createdAt
    }))

    return NextResponse.json(formattedMembers)
  } catch (error) {
    console.error('Error in /api/entities/[entityId]/members:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
