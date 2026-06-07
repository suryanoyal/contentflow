import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// DELETE /api/platforms/[id]/slots/[slotId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; slotId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slotId } = await params;

    await prisma.postingSlot.delete({ where: { id: slotId } });

    return NextResponse.json({ message: "Slot deleted" });
  } catch (error) {
    console.error("Error deleting slot:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
