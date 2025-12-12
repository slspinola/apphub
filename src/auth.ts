import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { authConfig } from './auth.config'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import type { Adapter } from 'next-auth/adapters'

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma) as Adapter,
    session: { strategy: 'jwt' },
    // Cookie configuration is inherited from authConfig to ensure consistency with middleware
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials)

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data
                    const user = await prisma.user.findUnique({ where: { email } })
                    if (!user) return null

                    // Allow login if user has no password (e.g. OAuth) - logic might need adjustment
                    if (!user.passwordHash) return null

                    const passwordsMatch = await bcrypt.compare(password, user.passwordHash)
                    if (passwordsMatch) return user
                }

                console.log('Invalid credentials')
                return null
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger }) {
            if (user) {
                token.id = user.id
                token.role = user.role
            }
            
            // Check for active impersonation if this is not a sign-in
            if (trigger !== 'signIn' && token.id) {
                try {
                    const impersonation = await prisma.userImpersonation.findFirst({
                        where: {
                            adminId: token.id as string,
                            endedAt: null,
                        },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    role: true,
                                    image: true,
                                }
                            }
                        },
                        orderBy: { startedAt: 'desc' }
                    })

                    if (impersonation) {
                        // Check if impersonation has timed out (1 hour)
                        const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
                        if (impersonation.startedAt < hourAgo) {
                            // Auto-expire the impersonation
                            await prisma.userImpersonation.update({
                                where: { id: impersonation.id },
                                data: { endedAt: new Date() }
                            })
                        } else {
                            // Store both admin and impersonated user info
                            token.impersonation = {
                                adminId: token.id,
                                adminRole: token.role,
                                userId: impersonation.user.id,
                                userRole: impersonation.user.role,
                                userName: impersonation.user.name,
                                userEmail: impersonation.user.email,
                                userImage: impersonation.user.image,
                            }
                        }
                    } else {
                        // Clear impersonation if it exists
                        delete token.impersonation
                    }
                } catch (error) {
                    console.error('Error checking impersonation:', error)
                }
            }
            
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                // If impersonating, use the impersonated user's data
                if (token.impersonation) {
                    const imp = token.impersonation as any
                    session.user.id = imp.userId
                    session.user.role = imp.userRole
                    session.user.name = imp.userName
                    session.user.email = imp.userEmail
                    session.user.image = imp.userImage
                    // Store admin info for reference
                    session.user.impersonatedBy = {
                        id: imp.adminId,
                        role: imp.adminRole
                    }
                } else {
                    session.user.id = token.id as string
                    session.user.role = token.role as string
                }
            }
            return session
        },
    },
})
