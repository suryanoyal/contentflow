import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { contentSchema } from "@/lib/validations";
import { generateContentId } from "@/lib/content-id";

// GET /api/content - List content with filters & pagination
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: Record<string, unknown> = {
      clientId: session.user.clientId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { contentId: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type) where.contentType = type;
    if (status) where.status = status;

    const [contents, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          schedules: {
            where: { status: "SCHEDULED" },
            select: { id: true },
          },
        },
      }),
      prisma.content.count({ where }),
    ]);

    return NextResponse.json({
      contents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/content - Create new content
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = contentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, description, contentType, notes } = validation.data;

    // Generate Content ID
    const contentId = await generateContentId(
      session.user.clientId,
      contentType
    );

    const content = await prisma.content.create({
      data: {
        contentId,
        name,
        description,
        contentType,
        status: validation.data.status || "DRAFT",
        notes,
        clientId: session.user.clientId,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "CONTENT_CREATED",
        entityType: "content",
        entityId: content.id,
        metadata: JSON.stringify({ contentId, name, contentType }),
        userId: session.user.id,
        clientId: session.user.clientId,
      },
    });

    return NextResponse.json({ content }, { status: 201 });
  } catch (error) {
    console.error("Error creating content:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
