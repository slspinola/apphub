const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== User Memberships in AppHub ===\n');

    const memberships = await prisma.membership.findMany({
      include: {
        user: { select: { id: true, email: true, name: true } },
        entity: { select: { id: true, name: true, slug: true } }
      }
    });

    memberships.forEach((m, i) => {
      console.log(`${i + 1}. User: ${m.user.email} (${m.userId})`);
      console.log(`   Entity: ${m.entity.name} (${m.entityId})`);
      console.log(`   Role: ${m.role}`);
      console.log('');
    });

    console.log(`Total memberships: ${memberships.length}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
