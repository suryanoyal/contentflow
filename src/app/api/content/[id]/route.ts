import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { contentSchema } from "@/lib/validations";

// GET /api/content/[id]
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

    const content = await prisma.content.findFirst({
      where: { id, clientId: session.user.clientId },
      include: {
        schedules: {
          include: { platform: true },
          orderBy: { scheduledDate: "desc" },
        },
      },
    });

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/content/[id]
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
    const validation = contentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    // Check content exists and belongs to client
    const existing = await prisma.content.findFirst({
      where: { id, clientId: session.user.clientId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Status transition validation
    if (validation.data.status) {
      const from = existing.status;
      const to = validation.data.status;
      
      const validTransitions: Record<string, string[]> = {
        DRAFT: ["READY", "ARCHIVED"],
        READY: ["DRAFT", "SCHEDULED", "ARCHIVED"],
        SCHEDULED: ["READY", "POSTED", "ARCHIVED"],
        POSTED: ["ARCHIVED", "READY"],
        ARCHIVED: ["DRAFT", "READY"],
      };

      if (!validTransitions[from]?.includes(to)) {
        return NextResponse.json(
          { error: `Cannot transition from ${from} to ${to}` },
          { status: 400 }
        );
      }
    }

    const content = await prisma.content.update({
      where: { id },
      data: {
        name: validation.data.name,
        description: validation.data.description,
        contentType: validation.data.contentType,
        status: validation.data.status || existing.status,
        notes: validation.data.notes,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "CONTENT_UPDATED",
        entityType: "content",
        entityId: content.id,
        metadata: JSON.stringify({
          changes: {
            name: body.name,
            contentType: body.contentType,
            description: body.description,
            status: body.status,
            notes: body.notes,
          },
        }),
        userId: session.user.id,
        clientId: session.user.clientId,
      },
    });

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error updating content:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/content/[id]
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

    const existing = await prisma.content.findFirst({
      where: { id, clientId: session.user.clientId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    await prisma.content.delete({ where: { id } });

    return NextResponse.json({ message: "Content deleted" });
  } catch (error) {
    console.error("Error deleting content:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
