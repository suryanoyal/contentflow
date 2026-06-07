import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { settingsSchema } from "@/lib/validations";

// GET /api/settings
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { id: session.user.clientId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({
      settings: {
        cooldownDays: client.cooldownDays,
        accentColor: client.accentColor,
        theme: client.theme,
        timezone: client.timezone,
        defaultView: client.defaultView,
        clientName: client.name,
        clientLogo: client.logo,
      },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/settings
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    const updateData: Record<string, unknown> = {};
    if (body.cooldownDays !== undefined) updateData.cooldownDays = body.cooldownDays;
    if (body.accentColor !== undefined) updateData.accentColor = body.accentColor;
    if (body.theme !== undefined) updateData.theme = body.theme;
    if (body.timezone !== undefined) updateData.timezone = body.timezone;
    if (body.defaultView !== undefined) updateData.defaultView = body.defaultView;
    if (body.clientName !== undefined) updateData.name = body.clientName;

    const client = await prisma.client.update({
      where: { id: session.user.clientId },
      data: updateData,
    });

    return NextResponse.json({
      settings: {
        cooldownDays: client.cooldownDays,
        accentColor: client.accentColor,
        theme: client.theme,
        timezone: client.timezone,
        defaultView: client.defaultView,
        clientName: client.name,
      },
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
