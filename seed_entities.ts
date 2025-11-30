
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // 1. Check if any entity exists
    const entityCount = await prisma.entity.count()
    if (entityCount > 0) {
        console.log('Entities already exist. Skipping entity creation.')
    } else {
        console.log('No entities found. Creating default entity...')
        const defaultEntity = await prisma.entity.create({
            data: {
                name: 'Acme Corp',
                slug: 'acme-corp',
            }
        })
        console.log(`Created entity: ${defaultEntity.name} (${defaultEntity.id})`)
    }

    // 2. Fetch all users
    const users = await prisma.user.findMany({
        include: { memberships: true }
    })

    console.log(`Found ${users.length} users.`)

    // 3. Create memberships for users without them
    const defaultEntity = await prisma.entity.findFirst()
    if (!defaultEntity) {
        throw new Error('Default entity not found after creation attempt.')
    }

    for (const user of users) {
        if (user.memberships.length === 0) {
            console.log(`Adding membership for user: ${user.email}`)
            await prisma.membership.create({
                data: {
                    userId: user.id,
                    entityId: defaultEntity.id,
                    role: 'owner' // Default to owner for now
                }
            })
        } else {
            console.log(`User ${user.email} already has memberships.`)
        }

        // 4. Set admin role for specific user (optional, based on email)
        // For this task, I'll set the first user found as admin if no admin exists
        if (user.role !== 'admin') {
            // You can customize this logic to target a specific email
            // For now, let's just log it.
            // await prisma.user.update({ where: { id: user.id }, data: { role: 'admin' } })
        }
    }

    // Set specific user as admin for testing if needed
    // const adminEmail = 'spinola.development@outlook.com'
    // await prisma.user.update({ where: { email: adminEmail }, data: { role: 'admin' } })

    console.log('Seeding complete.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
