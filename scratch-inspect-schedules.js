const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clientId = 'cmq3vgelu0000vl2umk24vb3m';
  console.log("=== Active Schedules in DB with full ISO dates ===");
  const schedules = await prisma.schedule.findMany({
    where: { clientId },
    include: {
      content: true,
      platform: true
    },
    orderBy: [
      { scheduledDate: 'asc' },
      { scheduledTime: 'asc' }
    ]
  });
  
  for (const s of schedules) {
    console.log(`Schedule ID: ${s.id} | Date ISO: ${s.scheduledDate.toISOString()} | Time: ${s.scheduledTime} | Platform: ${s.platform.name} | Content: ${s.content.contentId} (${s.content.contentType})`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
