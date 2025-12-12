const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== All Users in AppHub Database ===\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        memberships: {
          select: {
            entity: { select: { name: true } },
            role: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    users.forEach((user, i) => {
      console.log(`${i + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Created: ${user.createdAt}`);
      if (user.memberships.length > 0) {
        console.log(`   Memberships: ${user.memberships.map(m => `${m.entity.name}(${m.role})`).join(', ')}`);
      }
      console.log('');
    });

    console.log(`Total users: ${users.length}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
