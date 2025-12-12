/**
 * Add a user to the bee2solutions entity
 *
 * Usage: npx tsx scripts/add-user-to-bee2solutions.ts <email>
 *
 * Example: npx tsx scripts/add-user-to-bee2solutions.ts admin@example.com
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]

  if (!email) {
    console.error('❌ Please provide an email address')
    console.log('Usage: npx tsx scripts/add-user-to-bee2solutions.ts <email>')
    process.exit(1)
  }

  console.log(`🔍 Looking for user with email: ${email}`)

  // Find the user
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    console.error(`❌ User not found with email: ${email}`)
    console.log('\nAvailable users:')
    const users = await prisma.user.findMany({
      select: { email: true, name: true },
      take: 10,
    })
    users.forEach((u) => console.log(`  - ${u.email} (${u.name || 'No name'})`))
    process.exit(1)
  }

  console.log(`✅ Found user: ${user.name || user.email} (${user.id})`)

  // Find the bee2solutions entity
  const entity = await prisma.entity.findUnique({
    where: { slug: 'bee2solutions' },
  })

  if (!entity) {
    console.error('❌ bee2solutions entity not found')
    console.log('Run: npx tsx scripts/setup-bee2app.ts first')
    process.exit(1)
  }

  console.log(`✅ Found entity: ${entity.name} (${entity.id})`)

  // Create or update membership
  const membership = await prisma.membership.upsert({
    where: {
      userId_entityId: {
        userId: user.id,
        entityId: entity.id,
      },
    },
    update: {
      role: 'admin',
    },
    create: {
      userId: user.id,
      entityId: entity.id,
      role: 'admin',
    },
  })

  console.log(`✅ Membership created/updated with role: ${membership.role}`)

  // Also create a membership scope for bee2app
  const app = await prisma.app.findUnique({
    where: { slug: 'bee2app' },
  })

  if (app) {
    await prisma.membershipScope.upsert({
      where: {
        membershipId_appId: {
          membershipId: membership.id,
          appId: app.id,
        },
      },
      update: {
        scopeType: 'full_access',
        scopeValue: null,
      },
      create: {
        membershipId: membership.id,
        appId: app.id,
        scopeType: 'full_access',
        scopeValue: null,
      },
    })
    console.log(`✅ Full access scope granted for bee2app`)
  }

  console.log('\n🎉 Done! The user can now:')
  console.log(`   1. Log in to AppHub at http://localhost:3000`)
  console.log(`   2. Switch to the "Bee2 Solutions" entity`)
  console.log(`   3. Access bee2app at http://localhost:3001`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
