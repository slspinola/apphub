/**
 * Check Accounts and Sessions
 * Investigates Prisma Adapter accounts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('='.repeat(70))
  console.log('CHECKING ACCOUNTS AND SESSIONS')
  console.log('='.repeat(70))
  console.log()

  // Check all accounts
  console.log('All Accounts in database:')
  const accounts = await prisma.account.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  })

  console.log(`Total accounts: ${accounts.length}`)
  accounts.forEach(account => {
    console.log(`- Provider: ${account.provider}`)
    console.log(`  User ID: ${account.userId}`)
    console.log(`  User Email: ${account.user.email}`)
    console.log(`  Provider Account ID: ${account.providerAccountId}`)
    console.log()
  })

  // Check all sessions
  console.log('All Sessions in database:')
  const sessions = await prisma.session.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  })

  console.log(`Total sessions: ${sessions.length}`)
  sessions.forEach(session => {
    console.log(`- Session Token: ${session.sessionToken.substring(0, 20)}...`)
    console.log(`  User ID: ${session.userId}`)
    console.log(`  User Email: ${session.user.email}`)
    console.log(`  Expires: ${session.expires}`)
    console.log()
  })

  console.log('='.repeat(70))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
