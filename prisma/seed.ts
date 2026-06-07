import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_PLATFORMS = [
  {
    name: "Instagram",
    icon: "instagram",
    color: "#E4405F",
    contentTypes: [
      { contentType: "REEL" as const, isAllowed: true },
      { contentType: "IMAGE" as const, isAllowed: true },
      { contentType: "VIDEO" as const, isAllowed: false },
    ],
    slots: ["09:00", "18:00"],
  },
  {
    name: "Facebook",
    icon: "facebook",
    color: "#1877F2",
    contentTypes: [
      { contentType: "REEL" as const, isAllowed: true },
      { contentType: "IMAGE" as const, isAllowed: true },
      { contentType: "VIDEO" as const, isAllowed: true },
    ],
    slots: ["19:00"],
  },
  {
    name: "LinkedIn",
    icon: "linkedin",
    color: "#0A66C2",
    contentTypes: [
      { contentType: "REEL" as const, isAllowed: true },
      { contentType: "IMAGE" as const, isAllowed: true },
      { contentType: "VIDEO" as const, isAllowed: true },
    ],
    slots: ["10:00"],
  },
  {
    name: "X",
    icon: "twitter",
    color: "#14171A",
    contentTypes: [
      { contentType: "REEL" as const, isAllowed: true },
      { contentType: "IMAGE" as const, isAllowed: true },
      { contentType: "VIDEO" as const, isAllowed: false },
    ],
    slots: ["12:00", "17:00"],
  },
  {
    name: "TikTok",
    icon: "music",
    color: "#00F2EA",
    contentTypes: [
      { contentType: "REEL" as const, isAllowed: true },
      { contentType: "IMAGE" as const, isAllowed: false },
      { contentType: "VIDEO" as const, isAllowed: false },
    ],
    slots: ["20:00"],
  },
  {
    name: "YouTube",
    icon: "youtube",
    color: "#FF0000",
    contentTypes: [
      { contentType: "REEL" as const, isAllowed: true },
      { contentType: "IMAGE" as const, isAllowed: false },
      { contentType: "VIDEO" as const, isAllowed: true },
    ],
    slots: ["14:00"],
  },
];

const SAMPLE_CONTENT = [
  { name: "Summer Collection Showcase", type: "REEL" as const, status: "READY" as const },
  { name: "Behind the Scenes", type: "REEL" as const, status: "READY" as const },
  { name: "Product Launch Teaser", type: "REEL" as const, status: "READY" as const },
  { name: "Customer Testimonial", type: "REEL" as const, status: "READY" as const },
  { name: "Team Introduction", type: "REEL" as const, status: "DRAFT" as const },
  { name: "Product Photography Set", type: "IMAGE" as const, status: "READY" as const },
  { name: "Infographic - Industry Stats", type: "IMAGE" as const, status: "READY" as const },
  { name: "Brand Story Carousel", type: "IMAGE" as const, status: "READY" as const },
  { name: "Feature Highlight Cards", type: "IMAGE" as const, status: "DRAFT" as const },
  { name: "Full Product Demo", type: "VIDEO" as const, status: "READY" as const },
  { name: "CEO Interview", type: "VIDEO" as const, status: "READY" as const },
  { name: "Tutorial: Getting Started", type: "VIDEO" as const, status: "DRAFT" as const },
];

async function main() {
  console.log("🌱 Seeding ContentFlow database...\n");

  // Create demo client
  const client = await prisma.client.create({
    data: {
      name: "Acme Inc.",
      cooldownDays: 30,
      accentColor: "#6366f1",
      theme: "dark",
      timezone: "America/New_York",
      defaultView: "month",
    },
  });
  console.log(`✅ Created client: ${client.name}`);

  // Create admin user
  const hashedPassword = await bcrypt.hash("password123", 12);
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@contentflow.app",
      password: hashedPassword,
      role: "ADMIN",
      clientId: client.id,
    },
  });
  console.log(`✅ Created admin: ${admin.email} (password: password123)`);

  // Create platforms with content types and posting slots
  for (const p of DEFAULT_PLATFORMS) {
    const platform = await prisma.platform.create({
      data: {
        name: p.name,
        icon: p.icon,
        color: p.color,
        clientId: client.id,
        contentTypes: {
          create: p.contentTypes,
        },
        postingSlots: {
          create: p.slots.map((time) => ({ time })),
        },
      },
    });
    console.log(`✅ Created platform: ${platform.name} (${p.slots.length} slots)`);
  }

  // Create sample content
  const typeCounters: Record<string, number> = { REEL: 0, IMAGE: 0, VIDEO: 0 };
  const month = String(new Date().getMonth() + 1).padStart(2, "0");

  for (const c of SAMPLE_CONTENT) {
    typeCounters[c.type]++;
    const serial = String(typeCounters[c.type]).padStart(3, "0");
    const typeCode = c.type === "REEL" ? "R" : c.type === "IMAGE" ? "I" : "V";
    const contentId = `RX-${month}${serial}${typeCode}`;

    await prisma.content.create({
      data: {
        contentId,
        name: c.name,
        description: `Sample ${c.type.toLowerCase()} content for demonstration.`,
        contentType: c.type,
        status: c.status,
        clientId: client.id,
      },
    });
    console.log(`✅ Created content: ${contentId} — ${c.name}`);
  }

  console.log("\n🎉 Seed complete!");
  console.log("\n📧 Login credentials:");
  console.log("   Email: admin@contentflow.app");
  console.log("   Password: password123");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
