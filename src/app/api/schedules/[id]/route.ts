import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { validateScheduleEntry } from "@/lib/scheduler";

// PUT /api/schedules/[id] - Update schedule (drag & drop support)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.schedule.findFirst({
      where: { id, clientId: session.user.clientId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    // If moving to new date/platform, validate rules
    if (body.scheduledDate || body.platformId) {
      const newDate = body.scheduledDate
        ? new Date(body.scheduledDate)
        : existing.scheduledDate;
      const newPlatformId = body.platformId || existing.platformId;

      const validation = await validateScheduleEntry(
        existing.contentDbId,
        newPlatformId,
        newDate,
        id // exclude this schedule from conflict check
      );

      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (body.scheduledDate) updateData.scheduledDate = new Date(body.scheduledDate);
    if (body.scheduledTime) updateData.scheduledTime = body.scheduledTime;
    if (body.platformId) updateData.platformId = body.platformId;
    if (body.status) updateData.status = body.status;

    const schedule = await prisma.schedule.update({
      where: { id },
      data: updateData,
      include: {
        content: true,
        platform: true,
      },
    });

    // If marked as POSTED, update content
    if (body.status === "POSTED") {
      await prisma.content.update({
        where: { id: existing.contentDbId },
        data: {
          status: "POSTED",
          lastPostedDate: new Date(),
          lastPostedPlatform: schedule.platform.name,
          usageCount: { increment: 1 },
        },
      });
    }

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/schedules/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.schedule.delete({ where: { id } });

    return NextResponse.json({ message: "Schedule deleted" });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
