import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { validateScheduleEntry } from "@/lib/scheduler";

// GET /api/schedules
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const platformId = searchParams.get("platformId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {
      clientId: session.user.clientId,
    };

    if (start && end) {
      where.scheduledDate = {
        gte: new Date(start),
        lte: new Date(end),
      };
    }

    if (platformId) where.platformId = platformId;
    if (status) where.status = status;

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        content: true,
        platform: true,
      },
      orderBy: [
        { scheduledDate: "asc" },
        { scheduledTime: "asc" },
      ],
    });

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/schedules - Create a single schedule entry
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contentDbId, platformId, scheduledDate, scheduledTime } = body;

    // Validate
    const validation = await validateScheduleEntry(
      contentDbId,
      platformId,
      new Date(scheduledDate)
    );

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const schedule = await prisma.schedule.create({
      data: {
        contentDbId,
        platformId,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        clientId: session.user.clientId,
      },
      include: {
        content: true,
        platform: true,
      },
    });

    // Update content status
    await prisma.content.update({
      where: { id: contentDbId },
      data: { status: "SCHEDULED" },
    });

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
