/**
 * Diagnostic and Fix Script: Check and Create Missing Memberships
 *
 * Problem: Users can't access Bee2App features because they don't have
 * Membership records in AppHub database linking them to entities.
 *
 * This script:
 * 1. Lists all users in AppHub
 * 2. Lists all entities in AppHub
 * 3. Shows existing memberships
 * 4. Creates missing memberships as needed
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('='.repeat(60))
  console.log('APPHUB MEMBERSHIP DIAGNOSTIC')
  console.log('='.repeat(60))
  console.log()

  // 1. Check users
  console.log('📋 USERS IN APPHUB DATABASE:')
  console.log('-'.repeat(60))
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true
    }
  })

  if (users.length === 0) {
    console.log('❌ NO USERS FOUND!')
    console.log('You need to create a user first. Try logging into AppHub.')
    return
  }

  users.forEach((user, i) => {
    console.log(`${i + 1}. ${user.email} (${user.name || 'No name'})`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Role: ${user.role} | Status: ${user.status}`)
  })
  console.log()

  // 2. Check entities
  console.log('🏢 ENTITIES IN APPHUB DATABASE:')
  console.log('-'.repeat(60))
  const entities = await prisma.entity.findMany({
    select: {
      id: true,
      name: true,
      slug: true
    }
  })

  if (entities.length === 0) {
    console.log('❌ NO ENTITIES FOUND!')
    console.log('Creating a default entity...')

    const defaultEntity = await prisma.entity.create({
      data: {
        name: 'Default Organization',
        slug: 'default-org',
        settings: {}
      }
    })

    console.log(`✅ Created entity: ${defaultEntity.name} (${defaultEntity.slug})`)
    console.log(`   ID: ${defaultEntity.id}`)
    entities.push(defaultEntity)
  } else {
    entities.forEach((entity, i) => {
      console.log(`${i + 1}. ${entity.name} (${entity.slug})`)
      console.log(`   ID: ${entity.id}`)
    })
  }
  console.log()

  // 3. Check existing memberships
  console.log('🔗 EXISTING MEMBERSHIPS:')
  console.log('-'.repeat(60))
  const memberships = await prisma.membership.findMany({
    include: {
      user: {
        select: {
          email: true,
          name: true
        }
      },
      entity: {
        select: {
          name: true,
          slug: true
        }
      }
    }
  })

  if (memberships.length === 0) {
    console.log('❌ NO MEMBERSHIPS FOUND!')
  } else {
    memberships.forEach((m, i) => {
      console.log(`${i + 1}. ${m.user.email} → ${m.entity.name}`)
      console.log(`   Role: ${m.role}`)
      console.log(`   User ID: ${m.userId}`)
      console.log(`   Entity ID: ${m.entityId}`)
    })
  }
  console.log()

  // 4. Create missing memberships
  console.log('🔧 CREATING MISSING MEMBERSHIPS:')
  console.log('-'.repeat(60))

  let created = 0
  for (const user of users) {
    for (const entity of entities) {
      const exists = memberships.find(
        m => m.userId === user.id && m.entityId === entity.id
      )

      if (!exists) {
        // Determine role based on user's global role
        const role = user.role === 'admin' || user.role === 'system_admin'
          ? 'OWNER'
          : 'ADMIN'

        await prisma.membership.create({
          data: {
            userId: user.id,
            entityId: entity.id,
            role: role
          }
        })

        console.log(`✅ Created: ${user.email} → ${entity.name} (${role})`)
        created++
      }
    }
  }

  if (created === 0) {
    console.log('✅ All users already have memberships!')
  } else {
    console.log()
    console.log(`✅ Created ${created} new membership(s)`)
  }

  console.log()
  console.log('='.repeat(60))
  console.log('✅ DIAGNOSTIC COMPLETE')
  console.log('='.repeat(60))
  console.log()
  console.log('Next steps:')
  console.log('1. Restart both AppHub and Bee2App servers')
  console.log('2. Try accessing work orders in Bee2App')
  console.log('3. The permission check should now pass')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
