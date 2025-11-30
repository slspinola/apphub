
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Checking database...')

    const users = await prisma.user.findMany({
        include: {
            memberships: true
        }
    })

    console.log(`Found ${users.length} users:`)
    users.forEach(user => {
        console.log(`- ${user.email} (ID: ${user.id})`)
        console.log(`  Memberships: ${user.memberships.length}`)
        user.memberships.forEach(m => {
            console.log(`    - Entity ID: ${m.entityId}, Role: ${m.role}`)
        })
    })

    const entities = await prisma.entity.findMany()
    console.log(`\nFound ${entities.length} entities:`)
    entities.forEach(e => {
        console.log(`- ${e.name} (ID: ${e.id})`)
    })
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
