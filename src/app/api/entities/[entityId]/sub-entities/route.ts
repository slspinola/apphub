/**
 * GET /api/entities/:entityId/sub-entities
 * Returns all sub-entities (children) of an entity
 *
 * POST /api/entities/:entityId/sub-entities
 * Creates a new sub-entity under the given entity
 */

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params

    // Get all sub-entities (children) of the entity
    const subEntities = await prisma.entity.findMany({
      where: { parentId: entityId },
      include: {
        _count: {
          select: {
            memberships: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Format response with normalized field names for client compatibility
    const formattedSubEntities = subEntities.map(subEntity => ({
      id: subEntity.id,
      name: subEntity.name,
      slug: subEntity.slug,
      description: null, // Entity model doesn't have description
      parentId: subEntity.parentId,
      logoUrl: subEntity.logo, // Map 'logo' to 'logoUrl' for client
      primaryColor: null, // Entity model doesn't have primaryColor
      createdAt: subEntity.createdAt,
      updatedAt: subEntity.updatedAt,
      _count: subEntity._count
    }))

    return NextResponse.json(formattedSubEntities)
  } catch (error) {
    console.error('Error in GET /api/entities/[entityId]/sub-entities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params
    const body = await request.json()

    // Validate parent entity exists
    const parentEntity = await prisma.entity.findUnique({
      where: { id: entityId }
    })

    if (!parentEntity) {
      return NextResponse.json(
        { error: 'Parent entity not found' },
        { status: 404 }
      )
    }

    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Check slug uniqueness
    const existingSlug = await prisma.entity.findUnique({
      where: { slug: body.slug }
    })

    if (existingSlug) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      )
    }

    // Create sub-entity - only fields that exist in schema
    const subEntity = await prisma.entity.create({
      data: {
        name: body.name,
        slug: body.slug,
        parentId: entityId,
        logo: body.logoUrl || body.logo || null, // Accept both logoUrl and logo
        settings: body.settings || {}
      }
    })

    return NextResponse.json({
      id: subEntity.id,
      name: subEntity.name,
      slug: subEntity.slug,
      description: null,
      parentId: subEntity.parentId,
      logoUrl: subEntity.logo,
      primaryColor: null,
      createdAt: subEntity.createdAt,
      updatedAt: subEntity.updatedAt
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/entities/[entityId]/sub-entities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
