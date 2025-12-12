const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const apps = await prisma.app.findMany({
      where: {
        slug: {
          in: ['bee2app', 'hubapp']
        }
      },
      select: {
        slug: true,
        name: true,
        baseUrl: true
      }
    });

    console.log(JSON.stringify(apps, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
