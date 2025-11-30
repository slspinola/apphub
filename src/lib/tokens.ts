import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

/**
 * Generate a secure random token
 */
export function generateToken(): string {
    return crypto.randomBytes(32).toString('hex')
}

/**
 * Generate a password reset token for a user
 * Expires in 1 hour
 */
export async function generatePasswordResetToken(email: string): Promise<string> {
    const token = generateToken()
    const expires = new Date(Date.now() + 3600 * 1000) // 1 hour

    // Delete any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({
        where: { email },
    })

    // Create new token
    await prisma.passwordResetToken.create({
        data: {
            email,
            token,
            expires,
        },
    })

    return token
}

/**
 * Verify a password reset token
 * Returns the email if valid, null otherwise
 */
export async function verifyPasswordResetToken(token: string): Promise<string | null> {
    const passwordResetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
    })

    if (!passwordResetToken) {
        return null
    }

    // Check if expired
    if (passwordResetToken.expires < new Date()) {
        // Delete expired token
        await prisma.passwordResetToken.delete({
            where: { id: passwordResetToken.id },
        })
        return null
    }

    return passwordResetToken.email
}

/**
 * Delete a password reset token after use
 */
export async function deletePasswordResetToken(token: string): Promise<void> {
    await prisma.passwordResetToken.deleteMany({
        where: { token },
    })
}

/**
 * Generate an email verification token for a user
 * Expires in 24 hours
 */
export async function generateEmailVerificationToken(email: string): Promise<string> {
    const token = generateToken()
    const expires = new Date(Date.now() + 24 * 3600 * 1000) // 24 hours

    // Delete any existing tokens for this email
    await prisma.emailVerificationToken.deleteMany({
        where: { email },
    })

    // Create new token
    await prisma.emailVerificationToken.create({
        data: {
            email,
            token,
            expires,
        },
    })

    return token
}

/**
 * Verify an email verification token
 * Returns the email if valid, null otherwise
 */
export async function verifyEmailVerificationToken(token: string): Promise<string | null> {
    const emailVerificationToken = await prisma.emailVerificationToken.findUnique({
        where: { token },
    })

    if (!emailVerificationToken) {
        return null
    }

    // Check if expired
    if (emailVerificationToken.expires < new Date()) {
        // Delete expired token
        await prisma.emailVerificationToken.delete({
            where: { id: emailVerificationToken.id },
        })
        return null
    }

    return emailVerificationToken.email
}

/**
 * Delete an email verification token after use
 */
export async function deleteEmailVerificationToken(token: string): Promise<void> {
    await prisma.emailVerificationToken.deleteMany({
        where: { token },
    })
}

