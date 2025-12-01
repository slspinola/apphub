'use server'

import { prisma } from '@/lib/prisma'
import { CreateUserSchema, UpdateUserSchema } from './schemas'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { cookies } from 'next/headers'
import { isSystemAdminRole, SYSTEM_ADMIN_ROLE } from '@/lib/authorization'

type ActionResponse<T> =
    | { success: true; data: T; message?: string }
    | { success: false; error: string }

export async function getUsers(): Promise<ActionResponse<any[]>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // If system admin, fetch all users (including those not in any entity)
        if (isSystemAdminRole(session.user.role)) {
            const users = await prisma.user.findMany({
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    status: true,
                    createdAt: true,
                    memberships: {
                        select: {
                            entity: {
                                select: {
                                    id: true,
                                    name: true,
                                }
                            }
                        }
                    }
                },
            })
            return { success: true, data: users }
        }

        // If admin, fetch all users within their entities
        if (session.user.role === 'admin') {
            const users = await prisma.user.findMany({
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    status: true,
                    createdAt: true,
                },
            })
            return { success: true, data: users }
        }

        // For regular users, fetch users in the current entity context
        const cookieStore = await cookies()
        const currentEntityId = cookieStore.get('currentEntityId')?.value

        if (!currentEntityId) {
            // Fallback: fetch users where the current user has a membership in the same entity
            // This is a simplification. Ideally, we should enforce entity context.
            return { success: true, data: [] }
        }

        const users = await prisma.user.findMany({
            where: {
                memberships: {
                    some: {
                        entityId: currentEntityId
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
            },
        })
        return { success: true, data: users }
    } catch (error) {
        return { success: false, error: 'Failed to fetch users' }
    }
}

export async function createUser(data: unknown): Promise<ActionResponse<void>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    const result = CreateUserSchema.safeParse(data)

    if (!result.success) {
        return { success: false, error: 'Invalid data' }
    }

    const { email, password, name, role, status } = result.data

    // Only System Admin can create users with system_admin role
    if (role === SYSTEM_ADMIN_ROLE && !isSystemAdminRole(session.user.role)) {
        return { success: false, error: 'Only System Admins can create System Admin users' }
    }

    const isUserSystemAdmin = isSystemAdminRole(session.user.role)

    // Determine Entity ID
    const cookieStore = await cookies()
    const currentEntityId = cookieStore.get('currentEntityId')?.value

    // System Admin can create users without entity context
    if (!currentEntityId && !isUserSystemAdmin) {
        return { success: false, error: 'No entity context selected' }
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return { success: false, error: 'Email already in use' }
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        // Build user creation data
        const userData: any = {
            name,
            email,
            passwordHash: hashedPassword,
            role,
            status,
        }

        // Only add membership if there's an entity context
        if (currentEntityId) {
            userData.memberships = {
                create: {
                    entityId: currentEntityId,
                    role: 'member' // Default role in entity
                }
            }
        }

        await prisma.user.create({
            data: userData,
        })

        revalidatePath('/dashboard/users')
        return { success: true, data: undefined, message: 'User created successfully' }
    } catch (error) {
        return { success: false, error: 'Failed to create user' }
    }
}

export async function updateUser(data: unknown): Promise<ActionResponse<void>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    const result = UpdateUserSchema.safeParse(data)

    if (!result.success) {
        return { success: false, error: 'Invalid data' }
    }

    const { id, name, email, role, status } = result.data

    // Only System Admin can assign system_admin role
    if (role === SYSTEM_ADMIN_ROLE && !isSystemAdminRole(session.user.role)) {
        return { success: false, error: 'Only System Admins can assign System Admin role' }
    }

    // Check if target user is a System Admin - only System Admins can modify other System Admins
    const targetUser = await prisma.user.findUnique({
        where: { id },
        select: { role: true }
    })

    if (targetUser && isSystemAdminRole(targetUser.role) && !isSystemAdminRole(session.user.role)) {
        return { success: false, error: 'Only System Admins can modify System Admin users' }
    }

    try {
        await prisma.user.update({
            where: { id },
            data: {
                name,
                email,
                role,
                status,
            },
        })

        revalidatePath('/dashboard/users')
        return { success: true, data: undefined, message: 'User updated successfully' }
    } catch (error) {
        return { success: false, error: 'Failed to update user' }
    }
}

export async function deleteUser(id: string): Promise<ActionResponse<void>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    // Check if target user is a System Admin - only System Admins can delete other System Admins
    const targetUser = await prisma.user.findUnique({
        where: { id },
        select: { role: true }
    })

    if (targetUser && isSystemAdminRole(targetUser.role) && !isSystemAdminRole(session.user.role)) {
        return { success: false, error: 'Only System Admins can delete System Admin users' }
    }

    // Prevent self-deletion
    if (session.user.id === id) {
        return { success: false, error: 'You cannot delete your own account' }
    }

    try {
        await prisma.user.delete({
            where: { id },
        })

        revalidatePath('/dashboard/users')
        return { success: true, data: undefined, message: 'User deleted successfully' }
    } catch (error) {
        return { success: false, error: 'Failed to delete user' }
    }
}
