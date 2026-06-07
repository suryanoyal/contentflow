import prisma from "./prisma";
import { ContentType } from "@/types/prisma";

/**
 * Generate a Content ID in the format: RX-[MM][SSS][T]
 * - MM: 2-digit month
 * - SSS: 3-digit serial number (per content type, per month)
 * - T: Content type code (R=Reel, I=Image, V=Video)
 */
export async function generateContentId(
  clientId: string,
  contentType: ContentType,
  date?: Date
): Promise<string> {
  const now = date || new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const typeCode = getTypeCode(contentType);

  // Count existing content of this type for this month and client
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const count = await prisma.content.count({
    where: {
      clientId,
      contentType,
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  const serial = String(count + 1).padStart(3, "0");

  return `RX-${month}${serial}${typeCode}`;
}

function getTypeCode(type: ContentType): string {
  switch (type) {
    case "REEL":
      return "R";
    case "IMAGE":
      return "I";
    case "VIDEO":
      return "V";
    default:
      return "R";
  }
}

/**
 * Validate a content ID format
 */
export function isValidContentId(contentId: string): boolean {
  return /^RX-\d{2}\d{3}[RIV]$/.test(contentId);
}
