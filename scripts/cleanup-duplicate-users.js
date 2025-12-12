const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// IDs of duplicate users created as workaround
const DUPLICATE_USER_IDS = [
  'a5d73b8c-77e4-434b-997d-969c59380157',  // bee2app+spinola.development@outlook.com
  'e6f6fb2f-0f83-43ba-8e66-ef26e68df24b'   // bee2app3+spinola.development@outlook.com
];

(async () => {
  try {
    console.log('=== Cleaning Up Duplicate Users ===\n');

    // First, delete memberships for duplicate users
    console.log('1. Deleting memberships for duplicate users...');
    const deletedMemberships = await prisma.membership.deleteMany({
      where: {
        userId: { in: DUPLICATE_USER_IDS }
      }
    });
    console.log(`   Deleted ${deletedMemberships.count} membership(s)\n`);

    // Then delete the duplicate users
    console.log('2. Deleting duplicate users...');
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: { in: DUPLICATE_USER_IDS }
      }
    });
    console.log(`   Deleted ${deletedUsers.count} user(s)\n`);

    // Show remaining users
    console.log('3. Remaining users:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        memberships: {
          select: {
            entity: { select: { name: true } },
            role: true
          }
        }
      }
    });

    users.forEach((user) => {
      console.log(`   - ${user.email} (${user.id})`);
      if (user.memberships.length > 0) {
        console.log(`     Memberships: ${user.memberships.map(m => `${m.entity.name}(${m.role})`).join(', ')}`);
      }
    });

    console.log('\n=== Cleanup Complete ===');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
