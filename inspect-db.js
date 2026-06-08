const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const contents = await prisma.content.findMany({
    orderBy: { createdAt: "desc" },
  });

  console.log("=== CONTENT ===");
  console.log(`Total content items: ${contents.length}`);
  for (const c of contents) {
    console.log(`- ID: ${c.contentId}, Name: ${c.name}, Status: ${c.status}, UsageCount: ${c.usageCount}, LastPosted: ${c.lastPostedDate}`);
  }

  const schedules = await prisma.schedule.findMany({
    include: {
      content: true,
      platform: true,
    },
    orderBy: { scheduledDate: "asc" },
  });

  console.log("\n=== SCHEDULES ===");
  console.log(`Total schedule items: ${schedules.length}`);
  for (const s of schedules) {
    console.log(`- Date: ${s.scheduledDate.toISOString().split("T")[0]}, Time: ${s.scheduledTime}, Platform: ${s.platform.name}, Content: ${s.content.contentId} (${s.content.name}), Status: ${s.status}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
