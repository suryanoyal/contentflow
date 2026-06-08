const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { addDays } = require('date-fns');

function findBestContent(
  allContent,
  allowedTypes,
  currentDate,
  usedContentDates,
  dateKey,
  cooldownDays
) {
  // Filter content by allowed types and not already used on this date
  const eligible = allContent.filter((content) => {
    // Must be an allowed content type for this platform
    if (!allowedTypes.includes(content.contentType)) return false;

    // Must not already be scheduled on this date (same-day duplicate prevention)
    const usedDates = usedContentDates.get(content.id);
    if (usedDates && usedDates.has(dateKey)) return false;

    return true;
  });

  if (eligible.length === 0) return null;

  // Priority 1: Never posted content (usageCount === 0)
  const neverPosted = eligible.filter((c) => c.usageCount === 0);
  if (neverPosted.length > 0) {
    return neverPosted[0];
  }

  // Priority 2 & 3: Sort by oldest lastPostedDate, then lowest usageCount
  // Also check cooldown for recycling (using UTC timestamp comparisons)
  const recycleEligible = eligible.filter((c) => {
    if (!c.lastPostedDate) return true;
    const diffInMs = currentDate.getTime() - new Date(c.lastPostedDate).getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    return diffInDays >= cooldownDays;
  });

  if (recycleEligible.length > 0) {
    // Sort by lastPostedDate (oldest first), then usageCount (lowest first)
    recycleEligible.sort((a, b) => {
      if (!a.lastPostedDate && !b.lastPostedDate) return a.usageCount - b.usageCount;
      if (!a.lastPostedDate) return -1;
      if (!b.lastPostedDate) return 1;
      const dateDiff = new Date(a.lastPostedDate).getTime() - new Date(b.lastPostedDate).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.usageCount - b.usageCount;
    });
    return recycleEligible[0];
  }

  return null;
}

async function main() {
  const clientId = 'cmq3vgelu0000vl2umk24vb3m';
  const startDate = new Date("2026-06-15T00:00:00.000Z");
  const endDate = new Date("2026-06-21T23:59:59.000Z");

  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });
  if (!client) throw new Error("Client not found");

  const cooldownDays = client.cooldownDays;
  console.log("Cooldown days:", cooldownDays);

  const platforms = await prisma.platform.findMany({
    where: { clientId, isActive: true },
    include: {
      contentTypes: true,
      postingSlots: { where: { isActive: true }, orderBy: { time: "asc" } },
    },
  });

  const allContent = await prisma.content.findMany({
    where: {
      clientId,
      status: { in: ["READY", "SCHEDULED"] },
    },
    orderBy: [
      { usageCount: "asc" },
      { lastPostedDate: "asc" },
      { createdAt: "asc" },
    ],
  });

  console.log("All Content count:", allContent.length);
  for (const c of allContent) {
    console.log(`Content: ${c.contentId} (${c.contentType}) - status: ${c.status}, usageCount: ${c.usageCount}, lastPostedDate: ${c.lastPostedDate}`);
  }

  // Normalize startDate and endDate to midnight UTC
  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(0, 0, 0, 0);

  const existingSchedules = await prisma.schedule.findMany({
    where: {
      clientId,
      scheduledDate: { gte: start, lte: end },
      status: { not: "CANCELLED" },
    },
  });

  const usedContentDates = new Map();
  for (const schedule of existingSchedules) {
    const dateKey = new Date(schedule.scheduledDate).toISOString().split("T")[0];
    if (!usedContentDates.has(schedule.contentDbId)) {
      usedContentDates.set(schedule.contentDbId, new Set());
    }
    usedContentDates.get(schedule.contentDbId).add(dateKey);
  }

  const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  console.log("Total days to schedule:", totalDays);

  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    const currentDate = addDays(start, dayOffset);
    currentDate.setUTCHours(0, 0, 0, 0);
    const dateKey = currentDate.toISOString().split("T")[0];
    const currentDay = currentDate.getUTCDay();

    console.log(`\n--- Date: ${dateKey} (Day of week: ${currentDay}) ---`);

    for (const platform of platforms) {
      const allowedTypes = platform.contentTypes
        .filter((ct) => {
          if (!ct.isAllowed) return false;
          const allowedDaysStr = ct.allowedDays || "0,1,2,3,4,5,6";
          const allowedDaysArray = allowedDaysStr.split(",").filter(Boolean).map(Number);
          return allowedDaysArray.includes(currentDay);
        })
        .map((ct) => ct.contentType);

      console.log(`  Platform: ${platform.name}, Allowed types: ${allowedTypes.join(', ')}`);

      for (const slot of platform.postingSlots) {
        console.log(`    Slot time: ${slot.time}`);
        const slotTaken = existingSchedules.some(
          (s) =>
            s.platformId === platform.id &&
            s.scheduledTime === slot.time &&
            new Date(s.scheduledDate).getTime() === currentDate.getTime()
        );

        if (slotTaken) {
          console.log(`      Slot already taken.`);
          continue;
        }

        const bestContent = findBestContent(
          allContent,
          allowedTypes,
          currentDate,
          usedContentDates,
          dateKey,
          cooldownDays
        );

        if (bestContent) {
          console.log(`      SELECTED Content: ${bestContent.contentId} (${bestContent.contentType})`);
          if (!usedContentDates.has(bestContent.id)) {
            usedContentDates.set(bestContent.id, new Set());
          }
          usedContentDates.get(bestContent.id).add(dateKey);
          bestContent.usageCount += 1;
          bestContent.lastPostedDate = currentDate;
          bestContent.status = "SCHEDULED";
        } else {
          console.log(`      NO ELIGIBLE CONTENT FOUND!`);
        }
      }
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
