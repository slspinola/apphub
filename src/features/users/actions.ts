'use server'

import { prisma } from '@/lib/prisma'
import { CreateUserSchema, UpdateUserSchema } from './schemas'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { cookies } from 'next/headers'

type ActionResponse<T> =
    | { success: true; data: T; message?: string }
    | { success: false; error: string }

export async function getUsers(): Promise<ActionResponse<any[]>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // If system admin, fetch all users
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

    // Determine Entity ID
    // TODO: Add logic for System Admin to select entity from data
    const cookieStore = await cookies()
    const currentEntityId = cookieStore.get('currentEntityId')?.value

    if (!currentEntityId) {
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

        await prisma.user.create({
            data: {
                name,
                email,
                passwordHash: hashedPassword,
                role,
                status,
                memberships: {
                    create: {
                        entityId: currentEntityId,
                        role: 'member' // Default role in entity
                    }
                }
            },
        })

        revalidatePath('/dashboard/users')
        return { success: true, data: undefined, message: 'User created successfully' }
    } catch (error) {
        return { success: false, error: 'Failed to create user' }
    }
}

export async function updateUser(data: unknown): Promise<ActionResponse<void>> {
    const result = UpdateUserSchema.safeParse(data)

    if (!result.success) {
        return { success: false, error: 'Invalid data' }
    }

    const { id, name, email, role, status } = result.data

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
