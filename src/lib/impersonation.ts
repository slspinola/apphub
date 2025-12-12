import { auth } from '@/auth'

export async function isImpersonating(): Promise<boolean> {
    const session = await auth()
    return !!(session?.user as any)?.impersonatedBy
}

export async function getImpersonationContext() {
    const session = await auth()
    if (!session?.user) return null
    
    const user = session.user as any
    if (!user.impersonatedBy) return null
    
    return {
        isImpersonating: true,
        adminId: user.impersonatedBy.id,
        adminRole: user.impersonatedBy.role,
        impersonatedUserId: user.id,
        impersonatedUserName: user.name,
        impersonatedUserEmail: user.email,
    }
}

export async function getEffectiveUserId(): Promise<string | null> {
    const session = await auth()
    return session?.user?.id || null
}

export async function getActualUserId(): Promise<string | null> {
    const session = await auth()
    const user = session?.user as any
    
    if (user?.impersonatedBy) {
        return user.impersonatedBy.id
    }
    
    return user?.id || null
}

