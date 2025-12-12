
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Checking Users ---')
    const users = await prisma.user.findMany({
        include: {
            memberships: {
                include: {
                    entity: {
                        include: {
                            licenses: {
                                include: {
                                    app: true,
                                    plan: true
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    for (const user of users) {
        console.log(`User: ${user.email} (${user.id})`)
        if (user.memberships.length === 0) {
            console.log('  No memberships')
        }
        for (const membership of user.memberships) {
            console.log(`  Entity: ${membership.entity.name} (${membership.entity.id})`)
            const licenses = membership.entity.licenses
            if (licenses.length === 0) {
                console.log('    No licenses')
            } else {
                for (const license of licenses) {
                    console.log(`    License for App: ${license.app.name} (${license.app.slug})`)
                    console.log(`      Status: ${license.status}`)
                    console.log(`      Plan: ${license.plan.name}`)
                }
            }
        }
    }

    console.log('\n--- Checking Available Apps ---')
    const apps = await prisma.app.findMany({
        where: {
            status: 'ACTIVE',
            isPublic: true
        }
    })
    for (const app of apps) {
        console.log(`App: ${app.name} (${app.slug}) - Public: ${app.isPublic}, Status: ${app.status}`)
    }
}

main()
    .catch((e) => {
        console.error(e)
        proces.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
