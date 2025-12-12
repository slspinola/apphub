'use server'

import { signIn, signOut } from '@/auth'
import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import {
    generatePasswordResetToken,
    verifyPasswordResetToken,
    deletePasswordResetToken,
    generateEmailVerificationToken,
    verifyEmailVerificationToken,
    deleteEmailVerificationToken,
} from '@/lib/tokens'

const LoginSchema = z.object({
    email: z.string().email({
        message: 'Please enter a valid email address.',
    }),
    password: z.string().min(1, {
        message: 'Password is required.',
    }),
})

const RegisterSchema = z.object({
    name: z.string().min(1, { message: 'Name is required' }),
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(6, { message: 'Minimum 6 characters required' }),
})

const ForgotPasswordSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email address.' }),
})

const ResetPasswordSchema = z.object({
    token: z.string().min(1, { message: 'Token is required' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string().min(1, { message: 'Please confirm your password' }),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
})

type ActionResult = {
    success: boolean
    message: string
}

type AuthResult = {
    success: boolean
    error?: string
    redirectTo?: string
}

export async function authenticate(
    prevState: AuthResult | undefined,
    formData: FormData
): Promise<AuthResult> {
    const callbackUrl = formData.get('callbackUrl') as string || '/'

    try {
        await signIn('credentials', {
            email: formData.get('email'),
            password: formData.get('password'),
            redirect: false,
        })

        // Return success with redirect URL for client-side redirect
        return {
            success: true,
            redirectTo: callbackUrl,
        }
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return { success: false, error: 'Invalid credentials.' }
                default:
                    return { success: false, error: 'Something went wrong.' }
            }
        }
        throw error
    }
}

type RegisterResult = {
    success: boolean
    message: string
    email?: string
}

export async function register(
    prevState: RegisterResult | undefined,
    formData: FormData
): Promise<RegisterResult> {
    const validatedFields = RegisterSchema.safeParse(Object.fromEntries(formData.entries()))

    if (!validatedFields.success) {
        return { success: false, message: 'Invalid fields' }
    }

    const { email, password, name } = validatedFields.data

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return { success: false, message: 'Email already in use' }
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        await prisma.user.create({
            data: {
                name,
                email,
                passwordHash: hashedPassword,
            },
        })

        // Generate email verification token
        const token = await generateEmailVerificationToken(email)

        // TODO: Send verification email
        console.log(`Email verification link: /verify-email?token=${token}`)

        return {
            success: true,
            message: 'Account created! Please check your email to verify your account.',
            email,
        }
    } catch (error) {
        console.error('Registration error:', error)
        return { success: false, message: 'Failed to create user' }
    }
}

export async function logout() {
    try {
        await signOut({ redirect: false })
    } catch (error) {
        console.error('Logout error:', error)
        // Even if signOut fails, we still want to redirect to login
    }
    
    // Explicit redirect to login page after logout
    redirect('/login')
}

/**
 * Request a password reset email
 */
export async function requestPasswordReset(
    prevState: ActionResult | undefined,
    formData: FormData
): Promise<ActionResult> {
    const validatedFields = ForgotPasswordSchema.safeParse(
        Object.fromEntries(formData.entries())
    )

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Please enter a valid email address.',
        }
    }

    const { email } = validatedFields.data

    try {
        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email },
        })

        // Always return success message to prevent email enumeration
        if (!user) {
            return {
                success: true,
                message: 'If an account with that email exists, we have sent a password reset link.',
            }
        }

        // Generate token
        const token = await generatePasswordResetToken(email)

        // TODO: Send email with reset link
        // For now, log the token (in production, send email)
        console.log(`Password reset link: /reset-password?token=${token}`)

        return {
            success: true,
            message: 'If an account with that email exists, we have sent a password reset link.',
        }
    } catch (error) {
        console.error('Password reset error:', error)
        return {
            success: false,
            message: 'Something went wrong. Please try again.',
        }
    }
}

/**
 * Reset password using token
 */
export async function resetPassword(
    prevState: ActionResult | undefined,
    formData: FormData
): Promise<ActionResult> {
    const validatedFields = ResetPasswordSchema.safeParse(
        Object.fromEntries(formData.entries())
    )

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors
        const message = Object.values(errors).flat()[0] || 'Invalid input'
        return {
            success: false,
            message,
        }
    }

    const { token, password } = validatedFields.data

    try {
        // Verify token
        const email = await verifyPasswordResetToken(token)

        if (!email) {
            return {
                success: false,
                message: 'Invalid or expired reset link. Please request a new one.',
            }
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            return {
                success: false,
                message: 'User not found.',
            }
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Update user password
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedPassword },
        })

        // Delete the used token
        await deletePasswordResetToken(token)

        return {
            success: true,
            message: 'Password reset successfully. You can now log in with your new password.',
        }
    } catch (error) {
        console.error('Reset password error:', error)
        return {
            success: false,
            message: 'Something went wrong. Please try again.',
        }
    }
}

/**
 * Verify email address using token
 */
export async function verifyEmail(token: string): Promise<ActionResult> {
    try {
        const email = await verifyEmailVerificationToken(token)

        if (!email) {
            return {
                success: false,
                message: 'Invalid or expired verification link.',
            }
        }

        // Find user and update emailVerified
        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            return {
                success: false,
                message: 'User not found.',
            }
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
        })

        // Delete the used token
        await deleteEmailVerificationToken(token)

        return {
            success: true,
            message: 'Email verified successfully. You can now log in.',
        }
    } catch (error) {
        console.error('Email verification error:', error)
        return {
            success: false,
            message: 'Something went wrong. Please try again.',
        }
    }
}

/**
 * Resend email verification
 */
export async function resendVerificationEmail(
    prevState: ActionResult | undefined,
    formData: FormData
): Promise<ActionResult> {
    const email = formData.get('email') as string

    if (!email) {
        return {
            success: false,
            message: 'Email is required.',
        }
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            // Don't reveal if user exists
            return {
                success: true,
                message: 'If an account with that email exists, we have sent a verification link.',
            }
        }

        if (user.emailVerified) {
            return {
                success: false,
                message: 'Email is already verified.',
            }
        }

        const token = await generateEmailVerificationToken(email)

        // TODO: Send email with verification link
        console.log(`Verification link: /verify-email?token=${token}`)

        return {
            success: true,
            message: 'If an account with that email exists, we have sent a verification link.',
        }
    } catch (error) {
        console.error('Resend verification error:', error)
        return {
            success: false,
            message: 'Something went wrong. Please try again.',
        }
    }
}
