import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PUT /api/platforms/[id]
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

    // Handle content type rules update
    if (body.contentTypes) {
      for (const ct of body.contentTypes) {
        await prisma.platformContentType.upsert({
          where: {
            platformId_contentType: {
              platformId: id,
              contentType: ct.contentType,
            },
          },
          update: { 
            isAllowed: ct.isAllowed,
            allowedDays: ct.allowedDays !== undefined ? ct.allowedDays : undefined,
          },
          create: {
            platformId: id,
            contentType: ct.contentType,
            isAllowed: ct.isAllowed,
            allowedDays: ct.allowedDays ?? "0,1,2,3,4,5,6",
          },
        });
      }
    }

    // Handle platform update
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    let platform;
    if (Object.keys(updateData).length > 0) {
      platform = await prisma.platform.update({
        where: { id },
        data: updateData,
        include: {
          contentTypes: true,
          postingSlots: { orderBy: { time: "asc" } },
        },
      });
    } else {
      platform = await prisma.platform.findUnique({
        where: { id },
        include: {
          contentTypes: true,
          postingSlots: { orderBy: { time: "asc" } },
        },
      });
    }

    return NextResponse.json({ platform });
  } catch (error) {
    console.error("Error updating platform:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/platforms/[id]
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

    await prisma.platform.delete({ where: { id } });

    return NextResponse.json({ message: "Platform deleted" });
  } catch (error) {
    console.error("Error deleting platform:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
