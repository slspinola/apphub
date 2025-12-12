/**
 * Fix Bee2App User Membership
 * Creates user and membership for the actual Bee2App session user ID
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('='.repeat(70))
  console.log('FIXING BEE2APP USER MEMBERSHIP')
  console.log('='.repeat(70))
  console.log()

  const bee2appUserId = 'e6f6fb2f-0f83-43ba-8e66-ef26e68df24b'
  const dbUserId = 'cmiyyuncy0000f5d2en4t2q3n'
  const entityId = 'cmiyz6e8w0000zzxwt6bc4q78'

  // Get the database user info
  const dbUser = await prisma.user.findUnique({
    where: { id: dbUserId }
  })

  if (!dbUser) {
    console.log('❌ Database user not found!')
    return
  }

  console.log('Database user:', dbUser.email)

  // Check if Bee2App user exists
  let bee2appUser = await prisma.user.findUnique({
    where: { id: bee2appUserId }
  })

  if (!bee2appUser) {
    // User doesn't exist - we need to create one with a DIFFERENT email
    // since emails must be unique
    console.log('\nBee2App user does not exist')
    console.log('Creating Bee2App user with modified email...')

    bee2appUser = await prisma.user.create({
      data: {
        id: bee2appUserId,
        email: `bee2app3+${dbUser.email}`,  // Modified email to avoid conflict
        name: dbUser.name,
        emailVerified: dbUser.emailVerified,
        image: dbUser.image,
        role: dbUser.role,
        passwordHash: dbUser.passwordHash
      }
    })
    console.log('✅ User created:', bee2appUser.email)
  } else {
    console.log('✅ Bee2App user already exists:', bee2appUser.email)
  }

  // Create membership
  console.log('\nCreating membership...')
  const existingMembership = await prisma.membership.findUnique({
    where: {
      userId_entityId: {
        userId: bee2appUserId,
        entityId: entityId
      }
    }
  })

  if (existingMembership) {
    console.log('✅ Membership already exists!')
  } else {
    const membership = await prisma.membership.create({
      data: {
        userId: bee2appUserId,
        entityId: entityId,
        role: 'OWNER'
      }
    })
    console.log('✅ Membership created!')
    console.log(`User: ${bee2appUserId}`)
    console.log(`Entity: ${entityId}`)
    console.log(`Role: ${membership.role}`)
  }

  console.log()
  console.log('='.repeat(70))
  console.log('FIX COMPLETE')
  console.log('='.repeat(70))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
