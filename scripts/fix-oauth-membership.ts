/**
 * Fix OAuth User Membership
 * Creates membership record for OAuth-authenticated user
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('='.repeat(70))
  console.log('FIXING OAUTH USER MEMBERSHIP')
  console.log('='.repeat(70))
  console.log()

  const oauthUserId = 'e6f6fb2f-0f83-43ba-8e66-ef26e68df24b'
  const entityId = 'cmiyz6e8w0000zzxwt6bc4q78'

  // Check if membership already exists
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
    console.log('User ID:', oauthUserId)
    console.log('Entity ID:', entityId)
    console.log('Role:', existingMembership.role)
    return
  }

  // Create the membership
  console.log('Creating membership for OAuth user...')
  const membership = await prisma.membership.create({
    data: {
      userId: oauthUserId,
      entityId: entityId,
      role: 'OWNER'
    }
  })

  console.log('✅ Membership created successfully!')
  console.log('User ID:', membership.userId)
  console.log('Entity ID:', membership.entityId)
  console.log('Role:', membership.role)
  console.log()

  // Verify the user exists
  const user = await prisma.user.findUnique({
    where: { id: oauthUserId },
    select: {
      id: true,
      email: true,
      name: true
    }
  })

  if (user) {
    console.log('✅ User verified:')
    console.log('Email:', user.email)
    console.log('Name:', user.name)
  } else {
    console.log('⚠️ Warning: User not found in database')
  }

  console.log()
  console.log('='.repeat(70))
  console.log('MEMBERSHIP FIX COMPLETE')
  console.log('='.repeat(70))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
