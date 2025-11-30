'use server'

import { prisma } from '@/lib/prisma'
import { CreateEntitySchema } from './schemas'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { Entity } from '@prisma/client'

export type EntityWithRelations = Entity & {
    parent: Entity | null
    children: Entity[]
    role: string
}

type ActionResponse<T> =
    | { success: true; data: T; message?: string }
    | { success: false; error: string }

export async function getUserEntities(): Promise<ActionResponse<EntityWithRelations[]>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        const memberships = await prisma.membership.findMany({
            where: { userId: session.user.id },
            include: {
                entity: {
                    include: {
                        children: true,
                        parent: true
                    }
                },
            },
        })

        const entities = memberships.map((m) => ({
            ...m.entity,
            role: m.role,
        }))

        return { success: true, data: entities }
    } catch (error) {
        return { success: false, error: 'Failed to fetch entities' }
    }
}

export async function createEntity(data: unknown): Promise<ActionResponse<Entity>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    const result = CreateEntitySchema.safeParse(data)

    if (!result.success) {
        return { success: false, error: 'Invalid data' }
    }

    const { name, slug, parentId } = result.data

    try {
        const existingEntity = await prisma.entity.findUnique({
            where: { slug },
        })

        if (existingEntity) {
            return { success: false, error: 'Slug already in use' }
        }

        const entity = await prisma.entity.create({
            data: {
                name,
                slug,
                parentId,
                memberships: {
                    create: {
                        userId: session.user.id,
                        role: 'owner',
                    },
                },
            },
        })

        // Auto-switch to new entity if it's a root entity or user wants to
        if (!parentId) {
            const cookieStore = await cookies()
            cookieStore.set('currentEntityId', entity.id)
        }

        revalidatePath('/dashboard')
        return { success: true, data: entity, message: 'Entity created successfully' }
    } catch (error) {
        return { success: false, error: 'Failed to create entity' }
    }
}

export async function switchEntity(entityId: string): Promise<ActionResponse<void>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // Verify membership
        const membership = await prisma.membership.findUnique({
            where: {
                userId_entityId: {
                    userId: session.user.id,
                    entityId,
                },
            },
        })

        if (!membership) {
            return { success: false, error: 'You are not a member of this entity' }
        }

        const cookieStore = await cookies()
        cookieStore.set('currentEntityId', entityId)

        revalidatePath('/dashboard')
        return { success: true, data: undefined, message: 'Switched entity' }
    } catch (error) {
        return { success: false, error: 'Failed to switch entity' }
    }
}
