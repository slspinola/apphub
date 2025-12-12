/**
 * Check OAuth User Status
 * Investigates the OAuth user in the database
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('='.repeat(70))
  console.log('CHECKING OAUTH USER STATUS')
  console.log('='.repeat(70))
  console.log()

  const oauthUserId = 'e6f6fb2f-0f83-43ba-8e66-ef26e68df24b'
  const dbUserId = 'cmiyyuncy0000f5d2en4t2q3n'
  const entityId = 'cmiyz6e8w0000zzxwt6bc4q78'

  // Check OAuth user
  console.log('Checking OAuth user (from session)...')
  const oauthUser = await prisma.user.findUnique({
    where: { id: oauthUserId }
  })

  if (oauthUser) {
    console.log('✅ OAuth user EXISTS')
    console.log('ID:', oauthUser.id)
    console.log('Email:', oauthUser.email)
    console.log('Name:', oauthUser.name)
  } else {
    console.log('❌ OAuth user NOT FOUND')
  }
  console.log()

  // Check database user
  console.log('Checking database user (existing membership)...')
  const dbUser = await prisma.user.findUnique({
    where: { id: dbUserId }
  })

  if (dbUser) {
    console.log('✅ Database user EXISTS')
    console.log('ID:', dbUser.id)
    console.log('Email:', dbUser.email)
    console.log('Name:', dbUser.name)
  } else {
    console.log('❌ Database user NOT FOUND')
  }
  console.log()

  // Check all users
  console.log('All users in database:')
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true
    }
  })

  console.log(`Total users: ${allUsers.length}`)
  allUsers.forEach(user => {
    console.log(`- ${user.email} (${user.id.substring(0, 8)}...)`)
  })
  console.log()

  // Check memberships
  console.log('Memberships for entity:', entityId)
  const memberships = await prisma.membership.findMany({
    where: { entityId },
    include: {
      user: {
        select: {
          email: true,
          name: true
        }
      }
    }
  })

  console.log(`Total memberships: ${memberships.length}`)
  memberships.forEach(m => {
    console.log(`- ${m.user.email} (${m.userId.substring(0, 8)}...) - ${m.role}`)
  })
  console.log()

  // Check OAuth clients
  console.log('OAuth Clients:')
  const oauthClients = await prisma.oAuthClient.findMany({
    select: {
      id: true,
      clientId: true,
      name: true
    }
  })

  oauthClients.forEach(client => {
    console.log(`- ${client.name} (${client.clientId})`)
  })

  console.log()
  console.log('='.repeat(70))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
