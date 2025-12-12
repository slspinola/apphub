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

        revalidatePath('/users')
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

        revalidatePath('/users')
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

        revalidatePath('/users')
        return { success: true, data: undefined, message: 'User deleted successfully' }
    } catch (error) {
        return { success: false, error: 'Failed to delete user' }
    }
}

// ============================================================================
// USER DETAIL ACTIONS
// ============================================================================

export async function getUserDetails(userId: string): Promise<ActionResponse<any>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    // Check permission to view user
    const canView = session.user.id === userId || isSystemAdminRole(session.user.role)
    if (!canView) {
        return { success: false, error: 'Unauthorized to view this user' }
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                accounts: {
                    select: {
                        provider: true,
                        type: true,
                    }
                },
                memberships: {
                    include: {
                        entity: {
                            include: {
                                parent: true,
                                children: true,
                            }
                        },
                        scopes: true,
                    }
                },
                sessions: {
                    select: {
                        sessionToken: true,
                        expires: true,
                        updatedAt: true,
                    },
                    orderBy: { updatedAt: 'desc' }
                }
            }
        })

        if (!user) {
            return { success: false, error: 'User not found' }
        }

        return { success: true, data: user }
    } catch (error) {
        return { success: false, error: 'Failed to fetch user details' }
    }
}

export async function updateUserProfile(userId: string, data: any): Promise<ActionResponse<void>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    // Check permission
    const canUpdate = session.user.id === userId || isSystemAdminRole(session.user.role)
    if (!canUpdate) {
        return { success: false, error: 'Unauthorized to update this user' }
    }

    try {
        const updateData: any = {
            name: data.name,
            image: data.image,
        }

        // If email changed, reset verification
        if (data.email && data.email !== (await prisma.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email) {
            updateData.email = data.email
            updateData.emailVerified = null
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData
        })

        // Log activity
        await logUserActivity({
            userId,
            action: 'profile_updated',
            metadata: { updatedBy: session.user.id, emailChanged: !!updateData.emailVerified },
        })

        revalidatePath(`/users/${userId}`)
        return { success: true, data: undefined, message: 'Profile updated successfully' }
    } catch (error) {
        return { success: false, error: 'Failed to update profile' }
    }
}

export async function uploadUserAvatar(
    userId: string,
    formData: FormData
): Promise<ActionResponse<{ imageUrl: string }>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    // Check permission
    const canUpdate = session.user.id === userId || isSystemAdminRole(session.user.role)
    if (!canUpdate) {
        return { success: false, error: 'Unauthorized to update this user' }
    }

    try {
        const file = formData.get('file') as File
        if (!file) {
            return { success: false, error: 'No file provided' }
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return { success: false, error: 'File must be an image' }
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            return { success: false, error: 'File size must be less than 5MB' }
        }

        // For now, we'll use a simple base64 data URL approach
        // In production, you'd upload to S3/Cloudinary/etc.
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = buffer.toString('base64')
        const imageUrl = `data:${file.type};base64,${base64}`

        // Update user image
        await prisma.user.update({
            where: { id: userId },
            data: { image: imageUrl }
        })

        // Log activity
        await logUserActivity({
            userId,
            action: 'avatar_updated',
            metadata: { updatedBy: session.user.id },
        })

        revalidatePath(`/users/${userId}`)
        return { success: true, data: { imageUrl }, message: 'Avatar uploaded successfully' }
    } catch (error) {
        console.error('Upload avatar error:', error)
        return { success: false, error: 'Failed to upload avatar' }
    }
}

export async function verifyUserEmail(userId: string): Promise<ActionResponse<void>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    // Only system admin can verify emails
    if (!isSystemAdminRole(session.user.role)) {
        return { success: false, error: 'Only system admins can verify user emails' }
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { emailVerified: new Date() }
        })

        // Log activity
        await logUserActivity({
            userId,
            action: 'email_verified',
            metadata: { verifiedBy: session.user.id },
        })

        revalidatePath(`/users/${userId}`)
        return { success: true, data: undefined, message: 'Email verified successfully' }
    } catch (error) {
        return { success: false, error: 'Failed to verify email' }
    }
}

// ============================================================================
// PASSWORD MANAGEMENT
// ============================================================================

export async function resetUserPassword(
    userId: string, 
    method: 'temporary' | 'email'
): Promise<ActionResponse<{ temporaryPassword?: string }>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    // Only system admin can reset passwords
    if (!isSystemAdminRole(session.user.role)) {
        return { success: false, error: 'Only system admins can reset passwords' }
    }

    // Cannot reset system admin passwords
    const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, email: true }
    })

    if (!targetUser) {
        return { success: false, error: 'User not found' }
    }

    if (isSystemAdminRole(targetUser.role)) {
        return { success: false, error: 'Cannot reset system admin passwords' }
    }

    try {
        let temporaryPassword: string | undefined

        if (method === 'temporary') {
            // Generate secure random password
            temporaryPassword = generateSecurePassword()
            const hashedPassword = await bcrypt.hash(temporaryPassword, 10)

            await prisma.user.update({
                where: { id: userId },
                data: { passwordHash: hashedPassword }
            })
        }

        // Log password reset
        await prisma.passwordResetLog.create({
            data: {
                userId,
                resetBy: session.user.id,
                method: method === 'temporary' ? 'admin_reset' : 'email',
            }
        })

        // Log activity
        await logUserActivity({
            userId,
            action: 'password_reset',
            metadata: { 
                resetBy: session.user.id,
                method 
            },
        })

        revalidatePath(`/users/${userId}`)
        return { 
            success: true, 
            data: { temporaryPassword },
            message: method === 'temporary' ? 'Password reset successfully' : 'Password reset email sent'
        }
    } catch (error) {
        return { success: false, error: 'Failed to reset password' }
    }
}

function generateSecurePassword(): string {
    const length = 16
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    const array = new Uint32Array(length)
    crypto.getRandomValues(array)
    for (let i = 0; i < length; i++) {
        password += charset[array[i] % charset.length]
    }
    return password
}

// ============================================================================
// ENTITY MANAGEMENT
// ============================================================================

export async function getUserEntities(userId: string): Promise<ActionResponse<any[]>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    const canView = session.user.id === userId || isSystemAdminRole(session.user.role)
    if (!canView) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        const memberships = await prisma.membership.findMany({
            where: { userId },
            include: {
                entity: {
                    include: {
                        parent: true,
                        children: true,
                    }
                }
            }
        })

        return { success: true, data: memberships }
    } catch (error) {
        return { success: false, error: 'Failed to fetch entities' }
    }
}

export async function addUserToEntity(
    userId: string, 
    entityId: string, 
    role: string
): Promise<ActionResponse<void>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    // Only system admin can add users to entities
    if (!isSystemAdminRole(session.user.role)) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        await prisma.membership.create({
            data: {
                userId,
                entityId,
                role,
            }
        })

        // Log activity
        await logUserActivity({
            userId,
            action: 'entity_access_added',
            entityId,
            metadata: { 
                addedBy: session.user.id,
                role 
            },
        })

        revalidatePath(`/users/${userId}`)
        return { success: true, data: undefined, message: 'User added to entity successfully' }
    } catch (error) {
        return { success: false, error: 'Failed to add user to entity' }
    }
}

export async function updateUserEntityRole(
    membershipId: string,
    role: string
): Promise<ActionResponse<void>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    if (!isSystemAdminRole(session.user.role)) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        const membership = await prisma.membership.update({
            where: { id: membershipId },
            data: { role },
            include: { user: true, entity: true }
        })

        // Log activity
        await logUserActivity({
            userId: membership.userId,
            action: 'entity_role_changed',
            entityId: membership.entityId,
            metadata: { 
                changedBy: session.user.id,
                newRole: role 
            },
        })

        revalidatePath(`/users/${membership.userId}`)
        return { success: true, data: undefined, message: 'Role updated successfully' }
    } catch (error) {
        return { success: false, error: 'Failed to update role' }
    }
}

export async function removeUserFromEntity(membershipId: string): Promise<ActionResponse<void>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    if (!isSystemAdminRole(session.user.role)) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        const membership = await prisma.membership.findUnique({
            where: { id: membershipId },
            include: { user: true, entity: true }
        })

        if (!membership) {
            return { success: false, error: 'Membership not found' }
        }

        await prisma.membership.delete({
            where: { id: membershipId }
        })

        // Log activity
        await logUserActivity({
            userId: membership.userId,
            action: 'entity_access_removed',
            entityId: membership.entityId,
            metadata: { removedBy: session.user.id },
        })

        revalidatePath(`/users/${membership.userId}`)
        return { success: true, data: undefined, message: 'User removed from entity successfully' }
    } catch (error) {
        return { success: false, error: 'Failed to remove user from entity' }
    }
}

// ============================================================================
// APP ACCESS MANAGEMENT
// ============================================================================

export async function getUserAppAccess(userId: string): Promise<ActionResponse<any[]>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    const canView = session.user.id === userId || isSystemAdminRole(session.user.role)
    if (!canView) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // Get user's memberships
        const memberships = await prisma.membership.findMany({
            where: { userId },
            include: {
                entity: {
                    include: {
                        licenses: {
                            include: {
                                app: true,
                                plan: true,
                            }
                        }
                    }
                },
                scopes: true,
            }
        })

        // Build app access list
        const appAccess: any[] = []
        for (const membership of memberships) {
            for (const license of membership.entity.licenses) {
                const scope = membership.scopes.find(s => s.appId === license.appId)
                appAccess.push({
                    app: license.app,
                    license,
                    entity: membership.entity,
                    scope: scope || null,
                    membershipRole: membership.role,
                })
            }
        }

        return { success: true, data: appAccess }
    } catch (error) {
        return { success: false, error: 'Failed to fetch app access' }
    }
}

export async function updateUserAppScope(
    userId: string,
    appId: string,
    scopeData: { scopeType: string; scopeValue: any }
): Promise<ActionResponse<void>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    // Only system admin can update app scopes
    if (!isSystemAdminRole(session.user.role)) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // Get first membership for this user (simplified)
        const membership = await prisma.membership.findFirst({
            where: { userId }
        })

        if (!membership) {
            return { success: false, error: 'User has no entity memberships' }
        }

        // Upsert scope
        await prisma.membershipScope.upsert({
            where: {
                membershipId_appId: {
                    membershipId: membership.id,
                    appId,
                }
            },
            update: {
                scopeType: scopeData.scopeType,
                scopeValue: scopeData.scopeValue,
            },
            create: {
                membershipId: membership.id,
                appId,
                scopeType: scopeData.scopeType,
                scopeValue: scopeData.scopeValue,
            }
        })

        // Log activity
        await logUserActivity({
            userId,
            action: 'app_scope_changed',
            metadata: { 
                changedBy: session.user.id,
                appId,
                scopeType: scopeData.scopeType 
            },
        })

        revalidatePath(`/users/${userId}`)
        return { success: true, data: undefined, message: 'App scope updated successfully' }
    } catch (error) {
        return { success: false, error: 'Failed to update app scope' }
    }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export async function getUserSessions(userId: string): Promise<ActionResponse<any[]>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    const canView = session.user.id === userId || isSystemAdminRole(session.user.role)
    if (!canView) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        const sessions = await prisma.session.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' }
        })

        return { success: true, data: sessions }
    } catch (error) {
        return { success: false, error: 'Failed to fetch sessions' }
    }
}

export async function revokeUserSession(sessionToken: string): Promise<ActionResponse<void>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        const targetSession = await prisma.session.findUnique({
            where: { sessionToken }
        })

        if (!targetSession) {
            return { success: false, error: 'Session not found' }
        }

        // Check permission
        const canRevoke = session.user.id === targetSession.userId || isSystemAdminRole(session.user.role)
        if (!canRevoke) {
            return { success: false, error: 'Unauthorized' }
        }

        await prisma.session.delete({
            where: { sessionToken }
        })

        // Log activity
        await logUserActivity({
            userId: targetSession.userId,
            action: 'session_revoked',
            metadata: { revokedBy: session.user.id },
        })

        revalidatePath(`/users/${targetSession.userId}`)
        return { success: true, data: undefined, message: 'Session revoked successfully' }
    } catch (error) {
        return { success: false, error: 'Failed to revoke session' }
    }
}

export async function revokeAllUserSessions(userId: string): Promise<ActionResponse<void>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    const canRevoke = session.user.id === userId || isSystemAdminRole(session.user.role)
    if (!canRevoke) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        await prisma.session.deleteMany({
            where: { userId }
        })

        // Log activity
        await logUserActivity({
            userId,
            action: 'all_sessions_revoked',
            metadata: { revokedBy: session.user.id },
        })

        revalidatePath(`/users/${userId}`)
        return { success: true, data: undefined, message: 'All sessions revoked successfully' }
    } catch (error) {
        return { success: false, error: 'Failed to revoke sessions' }
    }
}

// ============================================================================
// ACTIVITY LOG
// ============================================================================

interface ActivityLogInput {
    userId: string
    action: string
    entityId?: string
    metadata?: any
    ipAddress?: string
    userAgent?: string
}

export async function logUserActivity(data: ActivityLogInput): Promise<void> {
    try {
        await prisma.userActivityLog.create({
            data: {
                userId: data.userId,
                action: data.action,
                entityId: data.entityId,
                metadata: data.metadata || {},
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
            }
        })
    } catch (error) {
        console.error('Failed to log activity:', error)
    }
}

export async function getUserActivityLog(
    userId: string,
    filters?: { action?: string; from?: Date; to?: Date; limit?: number }
): Promise<ActionResponse<any[]>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    const canView = session.user.id === userId || isSystemAdminRole(session.user.role)
    if (!canView) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        const where: any = { userId }

        if (filters?.action) {
            where.action = filters.action
        }

        if (filters?.from || filters?.to) {
            where.createdAt = {}
            if (filters.from) where.createdAt.gte = filters.from
            if (filters.to) where.createdAt.lte = filters.to
        }

        const logs = await prisma.userActivityLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: filters?.limit || 50,
        })

        return { success: true, data: logs }
    } catch (error) {
        return { success: false, error: 'Failed to fetch activity log' }
    }
}

// ============================================================================
// IMPERSONATION
// ============================================================================

export async function startImpersonation(
    userId: string,
    reason: string
): Promise<ActionResponse<void>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    // Only system admin can impersonate
    if (!isSystemAdminRole(session.user.role)) {
        return { success: false, error: 'Only system admins can impersonate users' }
    }

    // Cannot impersonate system admins
    const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
    })

    if (!targetUser) {
        return { success: false, error: 'User not found' }
    }

    if (isSystemAdminRole(targetUser.role)) {
        return { success: false, error: 'Cannot impersonate system admins' }
    }

    // Cannot impersonate self
    if (session.user.id === userId) {
        return { success: false, error: 'Cannot impersonate yourself' }
    }

    try {
        // Create impersonation record
        await prisma.userImpersonation.create({
            data: {
                adminId: session.user.id,
                userId,
                reason,
            }
        })

        // Log activity
        await logUserActivity({
            userId,
            action: 'impersonation_started',
            metadata: { adminId: session.user.id, reason },
        })

        return { success: true, data: undefined, message: 'Impersonation started' }
    } catch (error) {
        return { success: false, error: 'Failed to start impersonation' }
    }
}

export async function stopImpersonation(): Promise<ActionResponse<void>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // Find active impersonation
        const impersonation = await prisma.userImpersonation.findFirst({
            where: {
                adminId: session.user.id,
                endedAt: null,
            },
            orderBy: { startedAt: 'desc' }
        })

        if (!impersonation) {
            return { success: false, error: 'No active impersonation' }
        }

        // End impersonation
        await prisma.userImpersonation.update({
            where: { id: impersonation.id },
            data: { endedAt: new Date() }
        })

        // Log activity
        await logUserActivity({
            userId: impersonation.userId,
            action: 'impersonation_ended',
            metadata: { adminId: session.user.id },
        })

        return { success: true, data: undefined, message: 'Impersonation stopped' }
    } catch (error) {
        return { success: false, error: 'Failed to stop impersonation' }
    }
}

export async function getImpersonationStatus(): Promise<ActionResponse<any>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        const impersonation = await prisma.userImpersonation.findFirst({
            where: {
                adminId: session.user.id,
                endedAt: null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            },
            orderBy: { startedAt: 'desc' }
        })

        return { success: true, data: impersonation }
    } catch (error) {
        return { success: false, error: 'Failed to get impersonation status' }
    }
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export async function bulkAddToEntity(
    userIds: string[],
    entityId: string,
    role: string
): Promise<ActionResponse<void>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    if (!isSystemAdminRole(session.user.role)) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        const results = await Promise.allSettled(
            userIds.map(userId => 
                prisma.membership.create({
                    data: {
                        userId,
                        entityId,
                        role,
                    }
                })
            )
        )

        const successful = results.filter(r => r.status === 'fulfilled').length
        const failed = results.filter(r => r.status === 'rejected').length

        revalidatePath('/users')
        return { 
            success: true, 
            data: undefined, 
            message: `Added ${successful} users successfully${failed > 0 ? `, ${failed} failed` : ''}` 
        }
    } catch (error) {
        return { success: false, error: 'Failed to perform bulk operation' }
    }
}

export async function bulkUpdateStatus(
    userIds: string[],
    status: string
): Promise<ActionResponse<void>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    if (!isSystemAdminRole(session.user.role)) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        await prisma.user.updateMany({
            where: {
                id: { in: userIds },
                // Prevent updating system admins
                role: { not: 'system_admin' }
            },
            data: { status }
        })

        revalidatePath('/users')
        return { success: true, data: undefined, message: 'Users updated successfully' }
    } catch (error) {
        return { success: false, error: 'Failed to update users' }
    }
}

export async function bulkExportUsers(userIds: string[]): Promise<ActionResponse<string>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    if (!isSystemAdminRole(session.user.role)) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
            }
        })

        // Create CSV
        const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Created At']
        const rows = users.map(u => [
            u.id,
            u.name || '',
            u.email,
            u.role,
            u.status,
            u.createdAt.toISOString(),
        ])

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n')

        return { success: true, data: csv }
    } catch (error) {
        return { success: false, error: 'Failed to export users' }
    }
}
