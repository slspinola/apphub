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
      include: {
        oauthClient: {
          select: {
            clientId: true,
            redirectUris: true,
            scopes: true
          }
        }
      }
    });

    console.log(JSON.stringify(apps, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
