import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { getPlatformColor, getPlatformIcon } from "@/lib/utils";

const DEFAULT_PLATFORMS = [
  { name: "Instagram", icon: "instagram", color: "#E4405F", slots: ["09:00", "18:00"] },
  { name: "Facebook", icon: "facebook", color: "#1877F2", slots: ["19:00"] },
  { name: "LinkedIn", icon: "linkedin", color: "#0A66C2", slots: ["10:00"] },
  { name: "X", icon: "twitter", color: "#000000", slots: ["12:00", "17:00"] },
  { name: "TikTok", icon: "music", color: "#00F2EA", slots: ["20:00"] },
  { name: "YouTube", icon: "youtube", color: "#FF0000", slots: ["14:00"] },
];

const DEFAULT_CONTENT_TYPES = [
  { contentType: "REEL" as const, isAllowed: true },
  { contentType: "IMAGE" as const, isAllowed: true },
  { contentType: "VIDEO" as const, isAllowed: false },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, clientName } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create client with default platforms
    const client = await prisma.client.create({
      data: {
        name: clientName,
        platforms: {
          create: DEFAULT_PLATFORMS.map((p) => ({
            name: p.name,
            icon: p.icon,
            color: p.color,
            isCustom: false,
            contentTypes: {
              create: p.name === "TikTok"
                ? [
                    { contentType: "REEL", isAllowed: true },
                    { contentType: "IMAGE", isAllowed: false },
                    { contentType: "VIDEO", isAllowed: false },
                  ]
                : p.name === "YouTube"
                ? [
                    { contentType: "REEL", isAllowed: true },
                    { contentType: "IMAGE", isAllowed: false },
                    { contentType: "VIDEO", isAllowed: true },
                  ]
                : DEFAULT_CONTENT_TYPES,
            },
            postingSlots: {
              create: p.slots.map((time) => ({ time })),
            },
          })),
        },
      },
    });

    // Create admin user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "ADMIN",
        clientId: client.id,
      },
    });

    return NextResponse.json(
      { message: "Registration successful", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
