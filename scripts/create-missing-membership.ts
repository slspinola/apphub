/**
 * Create Missing Membership for OAuth User
 * Creates membership record to fix permission error
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('='.repeat(70))
  console.log('CREATING MISSING MEMBERSHIP')
  console.log('='.repeat(70))
  console.log()

  const oauthUserId = 'e6f6fb2f-0f83-43ba-8e66-ef26e68df24b'
  const dbUserId = 'cmiyyuncy0000f5d2en4t2q3n'
  const entityId = 'cmiyz6e8w0000zzxwt6bc4q78'

  // First, check if OAuth user exists
  console.log('Checking if OAuth user exists...')
  let oauthUser = await prisma.user.findUnique({
    where: { id: oauthUserId }
  })

  if (!oauthUser) {
    // OAuth user doesn't exist - get the database user
    const dbUser = await prisma.user.findUnique({
      where: { id: dbUserId }
    })

    if (!dbUser) {
      console.log('❌ Database user not found!')
      return
    }

    // Create the OAuth user with same email
    console.log(`Creating OAuth user with ID: ${oauthUserId}`)
    oauthUser = await prisma.user.create({
      data: {
        id: oauthUserId,
        email: dbUser.email,
        name: dbUser.name,
        emailVerified: dbUser.emailVerified,
        image: dbUser.image,
        role: dbUser.role
      }
    })
    console.log('✅ OAuth user created')
  } else {
    console.log('✅ OAuth user already exists')
  }

  // Now create the membership
  console.log('\nCreating membership...')
  const existingMembership = await prisma.membership.findUnique({
    where: {
      userId_entityId: {
        userId: oauthUserId,
        entityId: entityId
      }
    }
  })

  if (existingMembership) {
    console.log('✅ Membership already exists!')
  } else {
    const membership = await prisma.membership.create({
      data: {
        userId: oauthUserId,
        entityId: entityId,
        role: 'OWNER'
      }
    })
    console.log('✅ Membership created!')
    console.log(`User: ${oauthUserId}`)
    console.log(`Entity: ${entityId}`)
    console.log(`Role: ${membership.role}`)
  }

  console.log()
  console.log('='.repeat(70))
  console.log('FIX COMPLETE - OAuth user should now have permissions')
  console.log('='.repeat(70))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
