'use server'

import { prisma } from '@/lib/prisma'
import { CreateEntitySchema } from './schemas'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { Entity } from '@prisma/client'
import {
    isSystemAdminRole,
    canViewSubEntities,
    canManageSubEntities,
    getPermissionsForRole,
    SUB_ENTITY_MANAGEMENT_ROLES,
} from '@/lib/authorization'
import type { EntityNode } from '@/types/entities'

export type EntityWithRelations = Entity & {
    parent: Entity | null
    children: Entity[]
    role: string
}

type ActionResponse<T> =
    | { success: true; data: T; message?: string }
    | { success: false; error: string }

type EntityWithChildren = Entity & {
    children: EntityWithChildren[]
}

export async function getUserEntities(): Promise<ActionResponse<EntityWithRelations[]>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // System Admin can see all entities
        if (isSystemAdminRole(session.user.role)) {
            const allEntities = await prisma.entity.findMany({
                include: {
                    children: true,
                    parent: true
                },
                orderBy: { name: 'asc' }
            })

            const entities = allEntities.map((entity) => ({
                ...entity,
                role: 'system_admin' as const, // System Admin has full access to all entities
            }))

            return { success: true, data: entities }
        }

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

        revalidatePath('/')
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
        // System Admin can switch to any entity without membership
        if (!isSystemAdminRole(session.user.role)) {
            // Verify membership for non-system admins
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
        } else {
            // Verify entity exists for System Admin
            const entity = await prisma.entity.findUnique({
                where: { id: entityId },
            })

            if (!entity) {
                return { success: false, error: 'Entity not found' }
            }
        }

        const cookieStore = await cookies()
        cookieStore.set('currentEntityId', entityId)

        revalidatePath('/')
        return { success: true, data: undefined, message: 'Switched entity' }
    } catch (error) {
        return { success: false, error: 'Failed to switch entity' }
    }
}

/**
 * Get the current entity with its children for navigation
 */
export async function getCurrentEntityWithChildren(
    entityId: string
): Promise<ActionResponse<EntityWithRelations & { children: EntityWithRelations[] }>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        const entity = await prisma.entity.findUnique({
            where: { id: entityId },
            include: {
                parent: true,
                children: {
                    include: {
                        children: {
                            include: {
                                children: true, // 3 levels deep
                            },
                        },
                    },
                    orderBy: { name: 'asc' },
                },
            },
        })

        if (!entity) {
            return { success: false, error: 'Entity not found' }
        }

        // Get membership role
        let role = 'system_admin'
        if (!isSystemAdminRole(session.user.role)) {
            const membership = await prisma.membership.findUnique({
                where: {
                    userId_entityId: {
                        userId: session.user.id,
                        entityId,
                    },
                },
            })
            if (!membership) {
                return { success: false, error: 'Not a member of this entity' }
            }
            role = membership.role
        }

        // Build the response with role
        const entityWithRole = {
            ...entity,
            role,
            children: entity.children.map((child) => ({
                ...child,
                role, // Inherit parent's role for children
                parent: entity,
                children: (child as EntityWithChildren).children?.map((grandChild) => ({
                    ...grandChild,
                    role,
                    parent: child,
                    children: (grandChild as EntityWithChildren).children || [],
                })) || [],
            })),
        }

        return { success: true, data: entityWithRole }
    } catch (error) {
        return { success: false, error: 'Failed to fetch entity' }
    }
}

/**
 * Get entity tree for navigation sidebar
 * Returns hierarchical structure based on user's access
 */
export async function getEntityTreeForNav(): Promise<ActionResponse<EntityNode[]>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        if (isSystemAdminRole(session.user.role)) {
            // System admin: get all root entities with children
            const rootEntities = await prisma.entity.findMany({
                where: { parentId: null },
                include: {
                    children: {
                        include: {
                            children: {
                                include: { children: true }, // 3 levels deep
                            },
                        },
                        orderBy: { name: 'asc' },
                    },
                },
                orderBy: { name: 'asc' },
            })

            const trees = rootEntities.map((entity) =>
                buildEntityNode(entity as EntityWithChildren, 'system_admin', 0)
            )

            return { success: true, data: trees }
        }

        // Regular user: get their entities with sub-entity management roles
        const memberships = await prisma.membership.findMany({
            where: {
                userId: session.user.id,
                role: { in: [...SUB_ENTITY_MANAGEMENT_ROLES] },
            },
            include: {
                entity: {
                    include: {
                        children: {
                            include: {
                                children: {
                                    include: { children: true },
                                },
                            },
                            orderBy: { name: 'asc' },
                        },
                    },
                },
            },
        })

        const trees = memberships.map((m) =>
            buildEntityNode(m.entity as EntityWithChildren, m.role, 0)
        )

        return { success: true, data: trees }
    } catch (error) {
        return { success: false, error: 'Failed to fetch entity tree' }
    }
}

/**
 * Build an EntityNode from an entity with children
 */
function buildEntityNode(
    entity: EntityWithChildren,
    role: string,
    depth: number
): EntityNode {
    return {
        id: entity.id,
        name: entity.name,
        slug: entity.slug,
        logo: entity.logo,
        role,
        depth,
        parentId: entity.parentId,
        children:
            entity.children?.map((child) =>
                buildEntityNode(child as EntityWithChildren, role, depth + 1)
            ) || [],
    }
}

/**
 * Get sub-entities for a parent entity with permission info
 */
export async function getSubEntities(
    parentEntityId: string
): Promise<
    ActionResponse<{
        entities: Entity[]
        permissions: {
            canView: boolean
            canEdit: boolean
            canCreate: boolean
            canDelete: boolean
        }
    }>
> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        let role = 'system_admin'

        if (!isSystemAdminRole(session.user.role)) {
            const membership = await prisma.membership.findUnique({
                where: {
                    userId_entityId: {
                        userId: session.user.id,
                        entityId: parentEntityId,
                    },
                },
            })

            if (!membership) {
                return {
                    success: true,
                    data: {
                        entities: [],
                        permissions: {
                            canView: false,
                            canEdit: false,
                            canCreate: false,
                            canDelete: false,
                        },
                    },
                }
            }

            role = membership.role
        }

        const permissions = getPermissionsForRole(role)

        if (!permissions.canViewSubEntities) {
            return {
                success: true,
                data: {
                    entities: [],
                    permissions: {
                        canView: false,
                        canEdit: false,
                        canCreate: false,
                        canDelete: false,
                    },
                },
            }
        }

        const subEntities = await prisma.entity.findMany({
            where: { parentId: parentEntityId },
            orderBy: { name: 'asc' },
        })

        return {
            success: true,
            data: {
                entities: subEntities,
                permissions: {
                    canView: permissions.canViewSubEntities,
                    canEdit: permissions.canEditSubEntities,
                    canCreate: permissions.canCreateSubEntities,
                    canDelete: permissions.canDeleteSubEntities,
                },
            },
        }
    } catch (error) {
        return { success: false, error: 'Failed to fetch sub-entities' }
    }
}

