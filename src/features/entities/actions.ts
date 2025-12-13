'use server'

import { prisma } from '@/lib/prisma'
import { CreateEntitySchema, UpdateEntitySchema, CreateInvitationSchema, AcceptInvitationSchema } from './schemas'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { Entity } from '@prisma/client'
import {
    isSystemAdminRole,
    canViewSubEntities,
    canManageSubEntities,
    canEditSubEntity,
    canManageEntity,
    getPermissionsForRole,
    SUB_ENTITY_MANAGEMENT_ROLES,
    canManageMembers,
} from '@/lib/authorization'
import type { EntityNode } from '@/types/entities'
import crypto from 'crypto'
import { sendInvitationEmail } from '@/lib/email/send-email'

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
        console.error('Error creating entity:', error)
        
        // Check if it's a foreign key constraint violation
        if (error && typeof error === 'object' && 'code' in error) {
            const prismaError = error as { code: string; meta?: { target?: string } }
            
            if (prismaError.code === 'P2003') {
                // Foreign key constraint failed
                if (prismaError.meta?.target === 'Membership_userId_fkey') {
                    return { 
                        success: false, 
                        error: 'Your session is invalid. Please log out and log in again.' 
                    }
                }
                return { 
                    success: false, 
                    error: 'A database constraint was violated. Please try again.' 
                }
            }
        }
        
        return { success: false, error: 'Failed to create entity' }
    }
}

export async function updateEntity(data: unknown): Promise<ActionResponse<Entity>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    const result = UpdateEntitySchema.safeParse(data)
    if (!result.success) {
        return { success: false, error: 'Invalid data' }
    }

    const { id, name, slug } = result.data

    try {
        // Get the entity to update
        const entity = await prisma.entity.findUnique({
            where: { id },
            include: { parent: true }
        })

        if (!entity) {
            return { success: false, error: 'Entity not found' }
        }

        // Check permissions
        let hasAccess = false
        
        if (isSystemAdminRole(session.user.role)) {
            hasAccess = true
        } else {
            // Check direct membership on this entity
            const directMembership = await prisma.membership.findUnique({
                where: {
                    userId_entityId: {
                        userId: session.user.id,
                        entityId: id,
                    },
                },
            })

            if (directMembership) {
                hasAccess = canManageEntity(session.user.role, directMembership.role)
            }

            // If this is a sub-entity, check parent membership for manager access
            if (!hasAccess && entity.parentId) {
                const parentMembership = await prisma.membership.findUnique({
                    where: {
                        userId_entityId: {
                            userId: session.user.id,
                            entityId: entity.parentId,
                        },
                    },
                })

                if (parentMembership && canEditSubEntity(session.user.role, parentMembership.role)) {
                    hasAccess = true
                }
            }
        }

        if (!hasAccess) {
            return { success: false, error: 'Insufficient permissions to update this entity' }
        }

        // Check if slug is already in use by another entity
        if (slug && slug !== entity.slug) {
            const existingEntity = await prisma.entity.findUnique({
                where: { slug },
            })

            if (existingEntity) {
                return { success: false, error: 'Slug already in use' }
            }
        }

        // Update entity
        const updatedEntity = await prisma.entity.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(slug && { slug }),
            },
        })

        revalidatePath('/')
        revalidatePath(`/entity/${entity.slug}`)
        if (slug && slug !== entity.slug) {
            revalidatePath(`/entity/${slug}`)
        }
        
        return { success: true, data: updatedEntity, message: 'Entity updated successfully' }
    } catch (error) {
        console.error('Error updating entity:', error)
        return { success: false, error: 'Failed to update entity' }
    }
}

export async function deleteEntity(entityId: string): Promise<ActionResponse<void>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // Get the entity to delete
        const entity = await prisma.entity.findUnique({
            where: { id: entityId },
            include: {
                _count: {
                    select: {
                        children: true,
                    },
                },
            },
        })

        if (!entity) {
            return { success: false, error: 'Entity not found' }
        }

        // Check if entity has children
        if (entity._count.children > 0) {
            return { 
                success: false, 
                error: `Cannot delete entity with ${entity._count.children} sub-entities. Delete sub-entities first.` 
            }
        }

        // Check permissions - only owner or system admin can delete
        let canDelete = false
        
        if (isSystemAdminRole(session.user.role)) {
            canDelete = true
        } else {
            const membership = await prisma.membership.findUnique({
                where: {
                    userId_entityId: {
                        userId: session.user.id,
                        entityId,
                    },
                },
            })

            if (membership && membership.role === 'owner') {
                canDelete = true
            }
        }

        if (!canDelete) {
            return { success: false, error: 'Only entity owners can delete entities' }
        }

        // Delete the entity (cascade will handle memberships, invites, licenses)
        await prisma.entity.delete({
            where: { id: entityId },
        })

        revalidatePath('/')
        revalidatePath('/entities')
        
        return { success: true, data: undefined, message: 'Entity deleted successfully' }
    } catch (error) {
        console.error('Error deleting entity:', error)
        return { success: false, error: 'Failed to delete entity' }
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
                    orderBy: { name: 'asc' },
                    include: {
                        children: {
                            orderBy: { name: 'asc' },
                            include: {
                                children: {
                                    orderBy: { name: 'asc' },
                                    include: { children: true }, // 3 levels deep
                                },
                            },
                        },
                    },
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

// ============================================================================
// INVITATION ACTIONS
// ============================================================================

/**
 * Create an invitation for a user to join an entity
 */
export async function createInvitation(data: unknown): Promise<ActionResponse<void>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    const result = CreateInvitationSchema.safeParse(data)
    if (!result.success) {
        return { success: false, error: 'Invalid data' }
    }

    const { email, role, entityId } = result.data

    try {
        // Check permissions
        if (!isSystemAdminRole(session.user.role)) {
            const membership = await prisma.membership.findUnique({
                where: {
                    userId_entityId: {
                        userId: session.user.id,
                        entityId,
                    },
                },
            })

            if (!membership || !canManageMembers(membership.role)) {
                return { success: false, error: 'Insufficient permissions to invite members' }
            }
        }

        // Check if user is already a member
        const existingUser = await prisma.user.findUnique({
            where: { email },
            include: {
                memberships: {
                    where: { entityId }
                }
            }
        })

        if (existingUser && existingUser.memberships.length > 0) {
            return { success: false, error: 'User is already a member of this entity' }
        }

        // Check for existing pending invite
        const existingInvite = await prisma.entityInvite.findUnique({
            where: {
                email_entityId: {
                    email,
                    entityId
                }
            }
        })

        if (existingInvite && !existingInvite.acceptedAt && existingInvite.expiresAt > new Date()) {
             return { success: false, error: 'A pending invitation already exists for this email' }
        }

        // Create invitation
        const token = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

        // Get entity details for the email
        const entity = await prisma.entity.findUnique({
            where: { id: entityId },
            select: { name: true }
        })

        if (!entity) {
            return { success: false, error: 'Entity not found' }
        }

        // Delete existing expired/accepted invite if exists (to allow re-invite)
        if (existingInvite) {
            await prisma.entityInvite.delete({
                where: { id: existingInvite.id }
            })
        }

        await prisma.entityInvite.create({
            data: {
                email,
                role,
                entityId,
                token,
                expiresAt,
            }
        })

        // Send invitation email
        const emailResult = await sendInvitationEmail({
            to: email,
            entityName: entity.name,
            inviterName: session.user.name || undefined,
            inviterEmail: session.user.email || '',
            role,
            token,
            expiresAt,
        })

        if (!emailResult.success) {
            console.warn(`Invitation created but email failed to send: ${emailResult.error}`)
            // Don't fail the invitation creation, just log the warning
        }

        revalidatePath(`/entity`)
        return { success: true, data: undefined, message: 'Invitation sent successfully' }
    } catch (error) {
        console.error('Error creating invitation:', error)
        return { success: false, error: 'Failed to create invitation' }
    }
}

/**
 * Revoke an invitation
 */
export async function revokeInvitation(invitationId: string): Promise<ActionResponse<void>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
         const invitation = await prisma.entityInvite.findUnique({
            where: { id: invitationId }
        })

        if (!invitation) {
            return { success: false, error: 'Invitation not found' }
        }

        // Check permissions
        if (!isSystemAdminRole(session.user.role)) {
            const membership = await prisma.membership.findUnique({
                where: {
                    userId_entityId: {
                        userId: session.user.id,
                        entityId: invitation.entityId,
                    },
                },
            })

            if (!membership || !canManageMembers(membership.role)) {
                return { success: false, error: 'Insufficient permissions to revoke invitations' }
            }
        }

        await prisma.entityInvite.delete({
            where: { id: invitationId }
        })

        revalidatePath(`/entity`)
        return { success: true, data: undefined, message: 'Invitation revoked' }
    } catch (error) {
        return { success: false, error: 'Failed to revoke invitation' }
    }
}

/**
 * Accept an invitation
 */
export async function acceptInvitation(token: string): Promise<ActionResponse<void>> {
     const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized: Please log in to accept the invitation' }
    }

    try {
        const invite = await prisma.entityInvite.findUnique({
            where: { token },
            include: { entity: true }
        })

        if (!invite) {
            return { success: false, error: 'Invalid invitation token' }
        }

        if (invite.acceptedAt) {
             return { success: false, error: 'Invitation already accepted' }
        }

        if (invite.expiresAt < new Date()) {
            return { success: false, error: 'Invitation expired' }
        }

        // Verify email matches logged in user
        if (session.user.email !== invite.email) {
             return { success: false, error: 'This invitation was sent to a different email address' }
        }

        // Check if already a member
         const membership = await prisma.membership.findUnique({
                where: {
                    userId_entityId: {
                        userId: session.user.id,
                        entityId: invite.entityId,
                    },
                },
            })

        if (membership) {
             // Just mark as accepted if already member
             await prisma.entityInvite.update({
                where: { id: invite.id },
                data: { acceptedAt: new Date() }
            })
             return { success: true, data: undefined, message: 'You are already a member of this entity' }
        }

        // Create membership and update invite in transaction
        await prisma.$transaction([
            prisma.membership.create({
                data: {
                    userId: session.user.id,
                    entityId: invite.entityId,
                    role: invite.role
                }
            }),
            prisma.entityInvite.update({
                where: { id: invite.id },
                data: { acceptedAt: new Date() }
            })
        ])

        revalidatePath('/')
        return { success: true, data: undefined, message: `Joined ${invite.entity.name} successfully` }

    } catch (error) {
        console.error('Error accepting invitation:', error)
        return { success: false, error: 'Failed to accept invitation' }
    }
}
