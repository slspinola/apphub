/**
 * Script to create a Super Administrator user
 * 
 * Usage: npx tsx create_super_admin.ts
 * 
 * This script creates or updates a user with System Admin role.
 * System Admins have unrestricted access to all resources in the system.
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const SUPER_ADMIN_EMAIL = 'spinola.development@outlook.com'
const SUPER_ADMIN_PASSWORD = 'qwerty123456'
const SUPER_ADMIN_ROLE = 'system_admin'

async function main() {
    // Verify database connection is configured
    if (!process.env.DATABASE_URL) {
        console.error('❌ Error: DATABASE_URL environment variable is not set.')
        console.error('Please ensure your .env file contains DATABASE_URL.')
        process.exit(1)
    }

    console.log(`Creating/updating Super Administrator: ${SUPER_ADMIN_EMAIL}...`)
    console.log('Connecting to database...')

    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10)

    const user = await prisma.user.upsert({
        where: { email: SUPER_ADMIN_EMAIL },
        update: {
            passwordHash: hashedPassword,
            role: SUPER_ADMIN_ROLE,
            status: 'active',
            emailVerified: new Date(), // Auto-verify email for super admin
        },
        create: {
            email: SUPER_ADMIN_EMAIL,
            name: 'Super Administrator',
            passwordHash: hashedPassword,
            role: SUPER_ADMIN_ROLE,
            status: 'active',
            emailVerified: new Date(), // Auto-verify email for super admin
        }
    })

    console.log(`✅ Successfully created/updated Super Administrator:`)
    console.log(`   Email: ${user.email}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Status: ${user.status}`)
}

main()
    .catch((error) => {
        console.error('Error:', error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

