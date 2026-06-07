import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/platforms/[id]/slots
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const slots = await prisma.postingSlot.findMany({
      where: { platformId: id },
      orderBy: { time: "asc" },
    });

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Error fetching slots:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/platforms/[id]/slots
export async function POST(
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
    const { time } = body;

    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json(
        { error: "Time must be in HH:mm format" },
        { status: 400 }
      );
    }

    const slot = await prisma.postingSlot.create({
      data: {
        time,
        platformId: id,
      },
    });

    return NextResponse.json({ slot }, { status: 201 });
  } catch (error) {
    console.error("Error creating slot:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
