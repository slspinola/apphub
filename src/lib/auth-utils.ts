import { prisma } from '@/lib/prisma'
import type { Session } from 'next-auth'

/**
 * Validates that the user referenced in the session exists in the database.
 * This prevents foreign key constraint violations when session JWTs reference
 * deleted or non-existent users.
 * 
 * @param session - The NextAuth session object
 * @returns true if the user exists in the database, false otherwise
 */
export async function validateSessionUser(session: Session | null): Promise<boolean> {
    // No session or no user ID means invalid
    if (!session?.user?.id) {
        return false
    }

    try {
        // Check if user exists in database
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true } // Only select ID for efficiency
        })

        return !!user
    } catch (error) {
        console.error('Error validating session user:', error)
        return false
    }
}

