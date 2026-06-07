import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${minutes} ${ampm}`;
}

export function getContentTypeCode(type: string): string {
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

export function getContentTypeLabel(type: string): string {
  switch (type) {
    case "REEL":
      return "Reel";
    case "IMAGE":
      return "Image / Carousel";
    case "VIDEO":
      return "Long Video";
    default:
      return type;
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "DRAFT":
      return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    case "READY":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "SCHEDULED":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "POSTED":
      return "bg-violet-500/20 text-violet-400 border-violet-500/30";
    case "ARCHIVED":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "FAILED":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "CANCELLED":
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    default:
      return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
  }
}

export function getPlatformColor(name: string): string {
  const colors: Record<string, string> = {
    Instagram: "#E4405F",
    Facebook: "#1877F2",
    LinkedIn: "#0A66C2",
    X: "#000000",
    TikTok: "#00F2EA",
    YouTube: "#FF0000",
  };
  return colors[name] || "#6366f1";
}

export function getPlatformIcon(name: string): string {
  const icons: Record<string, string> = {
    Instagram: "instagram",
    Facebook: "facebook",
    LinkedIn: "linkedin",
    X: "twitter",
    TikTok: "music",
    YouTube: "youtube",
  };
  return icons[name] || "globe";
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
