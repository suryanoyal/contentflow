const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== Platforms ===");
  const platforms = await prisma.platform.findMany({
    include: {
      contentTypes: true,
      postingSlots: true
    }
  });
  console.log(JSON.stringify(platforms, null, 2));

  console.log("\n=== Content Items ===");
  const contents = await prisma.content.findMany({
    orderBy: { createdAt: 'desc' }
  });
  console.log(contents.map(c => ({ id: c.id, contentId: c.contentId, name: c.name, contentType: c.contentType, status: c.status })));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
