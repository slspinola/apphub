/**
 * Script to set a user as System Admin
 * 
 * Usage: npx tsx set_system_admin.ts
 * 
 * This script sets the user spinola.development@outlook.com as a System Admin.
 * System Admins have unrestricted access to all resources in the system.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SYSTEM_ADMIN_EMAIL = 'spinola.development@outlook.com'
const SYSTEM_ADMIN_ROLE = 'system_admin'

async function main() {
    console.log(`Setting user ${SYSTEM_ADMIN_EMAIL} as System Admin...`)

    const user = await prisma.user.findUnique({
        where: { email: SYSTEM_ADMIN_EMAIL },
    })

    if (!user) {
        console.error(`User with email ${SYSTEM_ADMIN_EMAIL} not found.`)
        console.log('Make sure the user exists in the database before running this script.')
        process.exit(1)
    }

    if (user.role === SYSTEM_ADMIN_ROLE) {
        console.log(`User ${SYSTEM_ADMIN_EMAIL} is already a System Admin.`)
        return
    }

    await prisma.user.update({
        where: { email: SYSTEM_ADMIN_EMAIL },
        data: { role: SYSTEM_ADMIN_ROLE },
    })

    console.log(`✅ Successfully set ${SYSTEM_ADMIN_EMAIL} as System Admin.`)
    console.log(`Previous role: ${user.role}`)
    console.log(`New role: ${SYSTEM_ADMIN_ROLE}`)
}

main()
    .catch((error) => {
        console.error('Error:', error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

