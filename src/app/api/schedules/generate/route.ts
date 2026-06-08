import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateSchedule } from "@/lib/scheduler";
import prisma from "@/lib/prisma";

// POST /api/schedules/generate - Auto-generate schedules
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { startDate, endDate, platformId } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start and end dates are required" },
        { status: 400 }
      );
    }

    const result = await generateSchedule(
      session.user.clientId,
      new Date(startDate),
      new Date(endDate),
      platformId
    );

    // Create notification
    await prisma.notification.create({
      data: {
        type: "SCHEDULE_GENERATED",
        title: "Schedule Generated",
        message: `Generated ${result.created} schedule entries. ${result.skipped} slots skipped. ${result.conflicts.length} conflicts detected.`,
        userId: session.user.id,
        clientId: session.user.clientId,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "SCHEDULE_GENERATED",
        entityType: "schedule",
        metadata: JSON.stringify({
          startDate,
          endDate,
          created: result.created,
          skipped: result.skipped,
          conflicts: result.conflicts.length,
        }),
        userId: session.user.id,
        clientId: session.user.clientId,
      },
    });

    return NextResponse.json({
      created: result.created,
      skipped: result.skipped,
      conflicts: result.conflicts,
    });
  } catch (error) {
    console.error("Error generating schedule:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
