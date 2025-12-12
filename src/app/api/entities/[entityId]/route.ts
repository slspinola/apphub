/**
 * GET /api/entities/:entityId
 * Returns entity details
 *
 * PUT /api/entities/:entityId
 * Updates entity details
 */

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params

    // Get entity details with counts
    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
      include: {
        _count: {
          select: {
            memberships: true,
            children: true
          }
        }
      }
    })

    if (!entity) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      )
    }

    // Return entity with normalized field names for client compatibility
    return NextResponse.json({
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      description: null, // Entity model doesn't have description - return null for compatibility
      parentId: entity.parentId,
      logoUrl: entity.logo, // Map 'logo' to 'logoUrl' for client
      primaryColor: null, // Entity model doesn't have primaryColor - return null for compatibility
      settings: entity.settings,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      _count: entity._count
    })
  } catch (error) {
    console.error('Error in GET /api/entities/[entityId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params
    const body = await request.json()

    // Validate entity exists
    const existingEntity = await prisma.entity.findUnique({
      where: { id: entityId }
    })

    if (!existingEntity) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      )
    }

    // Update entity - only fields that exist in schema
    const updatedEntity = await prisma.entity.update({
      where: { id: entityId },
      data: {
        name: body.name ?? existingEntity.name,
        settings: body.settings ?? existingEntity.settings,
        logo: body.logoUrl ?? body.logo ?? existingEntity.logo // Accept both logoUrl and logo
      }
    })

    return NextResponse.json({
      id: updatedEntity.id,
      name: updatedEntity.name,
      slug: updatedEntity.slug,
      description: null,
      parentId: updatedEntity.parentId,
      logoUrl: updatedEntity.logo,
      primaryColor: null,
      settings: updatedEntity.settings,
      createdAt: updatedEntity.createdAt,
      updatedAt: updatedEntity.updatedAt
    })
  } catch (error) {
    console.error('Error in PUT /api/entities/[entityId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
