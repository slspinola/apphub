
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@example.com'
    const password = 'password123'
    const hashedPassword = await bcrypt.hash(password, 10)

    console.log(`Upserting user ${email}...`)

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash: hashedPassword,
            role: 'admin',
            status: 'active'
        },
        create: {
            email,
            name: 'Test Admin',
            passwordHash: hashedPassword,
            role: 'admin',
            status: 'active'
        }
    })

    console.log(`User ${user.email} created/updated with ID: ${user.id}`)

    // Ensure membership in default entity
    const entity = await prisma.entity.findFirst()
    if (entity) {
        await prisma.membership.upsert({
            where: {
                userId_entityId: {
                    userId: user.id,
                    entityId: entity.id
                }
            },
            update: {},
            create: {
                userId: user.id,
                entityId: entity.id,
                role: 'owner'
            }
        })
        console.log(`Membership ensured in ${entity.name}`)
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
