import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { settingsSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";

// GET /api/settings
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.clientId || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [client, user] = await Promise.all([
      prisma.client.findUnique({
        where: { id: session.user.clientId },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
      }),
    ]);

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
        userName: user?.name || "",
        userEmail: user?.email || "",
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
    if (!session?.user?.clientId || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Handle user profile updates
    if (body.userName !== undefined || body.userEmail !== undefined || body.userPassword) {
      const userUpdateData: Record<string, unknown> = {};
      if (body.userName !== undefined) userUpdateData.name = body.userName;
      if (body.userEmail !== undefined) userUpdateData.email = body.userEmail;
      if (body.userPassword) {
        userUpdateData.password = await bcrypt.hash(body.userPassword, 12);
      }
      
      await prisma.user.update({
        where: { id: session.user.id },
        data: userUpdateData,
      });
    }

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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    return NextResponse.json({
      settings: {
        cooldownDays: client.cooldownDays,
        accentColor: client.accentColor,
        theme: client.theme,
        timezone: client.timezone,
        defaultView: client.defaultView,
        clientName: client.name,
        userName: user?.name || "",
        userEmail: user?.email || "",
      },
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
