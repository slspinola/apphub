/**
 * Fix User Membership
 * Creates membership for the OAuth user from Bee2App
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('='.repeat(70))
  console.log('FIX USER MEMBERSHIP')
  console.log('='.repeat(70))
  console.log()

  const targetUserId = 'a5d73b8c-77e4-434b-997d-969c59380157'
  const entityId = 'cmiyz6e8w0000zzxwt6bc4q78'

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  })

  if (!user) {
    console.log(`❌ User ${targetUserId} not found in database!`)
    console.log('   This user needs to be created first.')
    console.log()
    console.log('All users in database:')
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true
      }
    })
    allUsers.forEach(u => {
      console.log(`   - ${u.email} (${u.id})`)
    })
    return
  }

  console.log('✅ User found:')
  console.log(`   Email: ${user.email}`)
  console.log(`   ID: ${user.id}`)
  console.log(`   Name: ${user.name}`)
  console.log(`   Role: ${user.role}`)
  console.log()

  // Check entity
  const entity = await prisma.entity.findUnique({
    where: { id: entityId },
    select: {
      id: true,
      name: true,
      slug: true
    }
  })

  if (!entity) {
    console.log(`❌ Entity ${entityId} not found!`)
    return
  }

  console.log('✅ Entity found:')
  console.log(`   Name: ${entity.name}`)
  console.log(`   Slug: ${entity.slug}`)
  console.log(`   ID: ${entity.id}`)
  console.log()

  // Check existing membership
  const existing = await prisma.membership.findUnique({
    where: {
      userId_entityId: {
        userId: targetUserId,
        entityId: entityId
      }
    }
  })

  if (existing) {
    console.log('✅ Membership already exists:')
    console.log(`   Role: ${existing.role}`)
    console.log(`   Created: ${existing.createdAt}`)
    return
  }

  console.log('Creating membership...')

  const membership = await prisma.membership.create({
    data: {
      userId: targetUserId,
      entityId: entityId,
      role: user.role === 'admin' || user.role === 'system_admin' ? 'OWNER' : 'ADMIN'
    }
  })

  console.log()
  console.log('✅ Membership created:')
  console.log(`   User: ${user.email}`)
  console.log(`   Entity: ${entity.name}`)
  console.log(`   Role: ${membership.role}`)
  console.log(`   Membership ID: ${membership.id}`)
  console.log()
  console.log('='.repeat(70))
  console.log('✅ DONE - Try accessing work orders in Bee2App now')
  console.log('='.repeat(70))
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
