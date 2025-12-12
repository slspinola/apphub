import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const memberships = await prisma.membership.findMany({
    where: { userId: 'a5d73b8c-77e4-434b-997d-969c59380157' }
  })
  console.log('Memberships:', JSON.stringify(memberships, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
