import prisma from "./prisma";
import { ContentStatus, ScheduleStatus } from "@/types/prisma";
import { addDays, isSameDay, differenceInDays } from "date-fns";

interface ScheduleEntry {
  contentDbId: string;
  platformId: string;
  scheduledDate: Date;
  scheduledTime: string;
  clientId: string;
}

interface GenerateResult {
  created: number;
  skipped: number;
  conflicts: string[];
  entries: ScheduleEntry[];
}

/**
 * Core Auto-Scheduling Engine
 * 
 * Priority Order:
 * 1. Never Posted Content (usageCount === 0)
 * 2. Oldest Last Posted Date
 * 3. Lowest Usage Count
 * 4. Eligible Recycled Content (past cooldown)
 */
export async function generateSchedule(
  clientId: string,
  startDate: Date,
  endDate: Date
): Promise<GenerateResult> {
  // Fetch client settings
  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!client) throw new Error("Client not found");

  const cooldownDays = client.cooldownDays;

  // Fetch active platforms with their content type rules and posting slots
  const platforms = await prisma.platform.findMany({
    where: { clientId, isActive: true },
    include: {
      contentTypes: true,
      postingSlots: { where: { isActive: true }, orderBy: { time: "asc" } },
    },
  });

  // Fetch all READY content for this client
  const allContent = await prisma.content.findMany({
    where: {
      clientId,
      status: "READY",
    },
    orderBy: [
      { usageCount: "asc" },
      { lastPostedDate: "asc" },
      { createdAt: "asc" },
    ],
  });

  // Fetch existing schedules in the date range
  const existingSchedules = await prisma.schedule.findMany({
    where: {
      clientId,
      scheduledDate: { gte: startDate, lte: endDate },
      status: { not: "CANCELLED" },
    },
  });

  // Track which content is used on which dates (content ID -> Set of date strings)
  const usedContentDates = new Map<string, Set<string>>();
  for (const schedule of existingSchedules) {
    const dateKey = schedule.scheduledDate.toISOString().split("T")[0];
    if (!usedContentDates.has(schedule.contentDbId)) {
      usedContentDates.set(schedule.contentDbId, new Set());
    }
    usedContentDates.get(schedule.contentDbId)!.add(dateKey);
  }

  const entries: ScheduleEntry[] = [];
  const conflicts: string[] = [];
  let created = 0;
  let skipped = 0;

  // Iterate through each date in the range
  const totalDays = differenceInDays(endDate, startDate) + 1;
  
  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    const currentDate = addDays(startDate, dayOffset);
    const dateKey = currentDate.toISOString().split("T")[0];

    // For each platform
    for (const platform of platforms) {
      // Get allowed content types for this platform on this specific day of the week
      const currentDay = currentDate.getDay(); // 0 (Sun) to 6 (Sat)
      const allowedTypes = platform.contentTypes
        .filter((ct) => {
          if (!ct.isAllowed) return false;
          const allowedDaysStr = ct.allowedDays || "0,1,2,3,4,5,6";
          const allowedDaysArray = allowedDaysStr.split(",").filter(Boolean).map(Number);
          return allowedDaysArray.includes(currentDay);
        })
        .map((ct) => ct.contentType);

      if (allowedTypes.length === 0) continue;

      // For each posting slot
      for (const slot of platform.postingSlots) {
        // Check if this slot already has a schedule
        const slotTaken = existingSchedules.some(
          (s) =>
            s.platformId === platform.id &&
            s.scheduledTime === slot.time &&
            isSameDay(s.scheduledDate, currentDate)
        );

        if (slotTaken) {
          skipped++;
          continue;
        }

        // Find best content for this slot
        const bestContent = findBestContent(
          allContent,
          allowedTypes,
          currentDate,
          usedContentDates,
          dateKey,
          cooldownDays
        );

        if (bestContent) {
          const entry: ScheduleEntry = {
            contentDbId: bestContent.id,
            platformId: platform.id,
            scheduledDate: currentDate,
            scheduledTime: slot.time,
            clientId,
          };

          entries.push(entry);

          // Mark content as used for this date
          if (!usedContentDates.has(bestContent.id)) {
            usedContentDates.set(bestContent.id, new Set());
          }
          usedContentDates.get(bestContent.id)!.add(dateKey);

          created++;
        } else {
          conflicts.push(
            `No eligible content for ${platform.name} on ${dateKey} at ${slot.time}`
          );
          skipped++;
        }
      }
    }
  }

  // Batch create all schedule entries
  if (entries.length > 0) {
    await prisma.schedule.createMany({
      data: entries.map((e) => ({
        contentDbId: e.contentDbId,
        platformId: e.platformId,
        scheduledDate: e.scheduledDate,
        scheduledTime: e.scheduledTime,
        clientId: e.clientId,
        status: "SCHEDULED",
      })),
    });

    // Update content usage counts
    const contentUsage = new Map<string, number>();
    for (const entry of entries) {
      contentUsage.set(
        entry.contentDbId,
        (contentUsage.get(entry.contentDbId) || 0) + 1
      );
    }

    for (const [contentId, count] of contentUsage) {
      await prisma.content.update({
        where: { id: contentId },
        data: {
          usageCount: { increment: count },
          status: "SCHEDULED",
        },
      });
    }
  }

  return { created, skipped, conflicts, entries };
}

/**
 * Find the best content piece for a given slot
 */
function findBestContent(
  allContent: Array<{
    id: string;
    contentType: string;
    usageCount: number;
    lastPostedDate: Date | null;
    status: string;
  }>,
  allowedTypes: string[],
  currentDate: Date,
  usedContentDates: Map<string, Set<string>>,
  dateKey: string,
  cooldownDays: number
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
  // Also check cooldown for recycling
  const recycleEligible = eligible.filter((c) => {
    if (!c.lastPostedDate) return true;
    return differenceInDays(currentDate, c.lastPostedDate) >= cooldownDays;
  });

  if (recycleEligible.length > 0) {
    // Sort by lastPostedDate (oldest first), then usageCount (lowest first)
    recycleEligible.sort((a, b) => {
      if (!a.lastPostedDate && !b.lastPostedDate) return a.usageCount - b.usageCount;
      if (!a.lastPostedDate) return -1;
      if (!b.lastPostedDate) return 1;
      const dateDiff = a.lastPostedDate.getTime() - b.lastPostedDate.getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.usageCount - b.usageCount;
    });
    return recycleEligible[0];
  }

  return null;
}

/**
 * Validate a schedule entry against all rules
 */
export async function validateScheduleEntry(
  contentDbId: string,
  platformId: string,
  scheduledDate: Date,
  excludeScheduleId?: string
): Promise<{ valid: boolean; error?: string }> {
  // Rule 1: Check same-day duplicate
  const existingOnDate = await prisma.schedule.findFirst({
    where: {
      contentDbId,
      scheduledDate,
      status: { not: "CANCELLED" },
      ...(excludeScheduleId ? { id: { not: excludeScheduleId } } : {}),
    },
  });

  if (existingOnDate) {
    return {
      valid: false,
      error: "This content is already scheduled on this date",
    };
  }

  // Rule 2: Check content status
  const content = await prisma.content.findUnique({
    where: { id: contentDbId },
  });

  if (!content) {
    return { valid: false, error: "Content not found" };
  }

  if (content.status === "ARCHIVED") {
    return { valid: false, error: "Archived content cannot be scheduled" };
  }

  if (content.status !== "READY" && content.status !== "SCHEDULED") {
    return { valid: false, error: "Only Ready or Scheduled content can be scheduled" };
  }

  // Rule 3: Check platform content type rules
  const platform = await prisma.platform.findUnique({
    where: { id: platformId },
    include: { contentTypes: true },
  });

  if (!platform) {
    return { valid: false, error: "Platform not found" };
  }

  const typeRule = platform.contentTypes.find(
    (ct) => ct.contentType === content.contentType
  );

  if (typeRule) {
    if (!typeRule.isAllowed) {
      return {
        valid: false,
        error: `${content.contentType} is not allowed on ${platform.name}`,
      };
    }

    const currentDay = scheduledDate.getDay(); // 0 (Sun) to 6 (Sat)
    const allowedDaysStr = typeRule.allowedDays || "0,1,2,3,4,5,6";
    const allowedDaysArray = allowedDaysStr.split(",").filter(Boolean).map(Number);
    if (!allowedDaysArray.includes(currentDay)) {
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return {
        valid: false,
        error: `${content.contentType} is not allowed on ${platform.name} on ${dayNames[currentDay]}s`,
      };
    }
  }

  return { valid: true };
}
