import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/platforms
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const platforms = await prisma.platform.findMany({
      where: { clientId: session.user.clientId },
      include: {
        contentTypes: true,
        postingSlots: { orderBy: { time: "asc" } },
        _count: {
          select: { schedules: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ platforms });
  } catch (error) {
    console.error("Error fetching platforms:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/platforms
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, icon, color } = body;

    if (!name) {
      return NextResponse.json({ error: "Platform name is required" }, { status: 400 });
    }

    const platform = await prisma.platform.create({
      data: {
        name,
        icon: icon || "globe",
        color: color || "#6366f1",
        isCustom: true,
        clientId: session.user.clientId,
        contentTypes: {
          create: [
            { contentType: "REEL", isAllowed: true },
            { contentType: "IMAGE", isAllowed: true },
            { contentType: "VIDEO", isAllowed: true },
          ],
        },
      },
      include: {
        contentTypes: true,
        postingSlots: true,
      },
    });

    return NextResponse.json({ platform }, { status: 201 });
  } catch (error) {
    console.error("Error creating platform:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
