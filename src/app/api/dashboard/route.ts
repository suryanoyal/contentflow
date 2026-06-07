import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { differenceInDays } from "date-fns";

// GET /api/dashboard
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = session.user.clientId;

    // Content status counts
    const [total, draft, ready, scheduled, posted, archived] = await Promise.all([
      prisma.content.count({ where: { clientId } }),
      prisma.content.count({ where: { clientId, status: "DRAFT" } }),
      prisma.content.count({ where: { clientId, status: "READY" } }),
      prisma.content.count({ where: { clientId, status: "SCHEDULED" } }),
      prisma.content.count({ where: { clientId, status: "POSTED" } }),
      prisma.content.count({ where: { clientId, status: "ARCHIVED" } }),
    ]);

    // Platform stats
    const platforms = await prisma.platform.findMany({
      where: { clientId },
      include: {
        _count: {
          select: {
            schedules: true,
          },
        },
        schedules: {
          where: { status: "POSTED" },
          select: { id: true },
        },
      },
    });

    const platformStats = platforms.map((p) => ({
      id: p.id,
      name: p.name,
      icon: p.icon,
      color: p.color,
      scheduledCount: p._count.schedules,
      postedCount: p.schedules.length,
    }));

    // Most and least used content
    const mostUsed = await prisma.content.findMany({
      where: { clientId, usageCount: { gt: 0 } },
      orderBy: { usageCount: "desc" },
      take: 5,
      select: {
        id: true,
        contentId: true,
        name: true,
        contentType: true,
        usageCount: true,
        lastPostedDate: true,
      },
    });

    const leastUsed = await prisma.content.findMany({
      where: { clientId, status: "READY" },
      orderBy: { usageCount: "asc" },
      take: 5,
      select: {
        id: true,
        contentId: true,
        name: true,
        contentType: true,
        usageCount: true,
        lastPostedDate: true,
      },
    });

    // Cooldown and reusable content
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    const cooldownDays = client?.cooldownDays || 30;
    const now = new Date();

    const postedContent = await prisma.content.findMany({
      where: {
        clientId,
        lastPostedDate: { not: null },
        status: { not: "ARCHIVED" },
      },
    });

    let cooldownCount = 0;
    let reusableCount = 0;

    for (const content of postedContent) {
      if (content.lastPostedDate) {
        const daysSincePosted = differenceInDays(now, content.lastPostedDate);
        if (daysSincePosted < cooldownDays) {
          cooldownCount++;
        } else {
          reusableCount++;
        }
      }
    }

    // Recent activity
    const recentActivity = await prisma.activityLog.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { name: true } },
      },
    });

    return NextResponse.json({
      stats: {
        totalContent: total,
        draftContent: draft,
        readyContent: ready,
        scheduledContent: scheduled,
        postedContent: posted,
        archivedContent: archived,
        platformStats,
        mostUsed,
        leastUsed,
        cooldownContent: cooldownCount,
        reusable: reusableCount,
      },
      recentActivity,
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
