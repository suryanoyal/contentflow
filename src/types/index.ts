// ─── Type Definitions ───────────────────────────────────

export type ContentTypeValue = "REEL" | "IMAGE" | "VIDEO";
export type ContentStatusValue = "DRAFT" | "READY" | "SCHEDULED" | "POSTED" | "ARCHIVED";
export type ScheduleStatusValue = "SCHEDULED" | "POSTED" | "FAILED" | "CANCELLED";
export type RoleValue = "ADMIN" | "MANAGER" | "EDITOR" | "VIEWER";
export type ThemeValue = "dark" | "light" | "system";
export type CalendarView = "month" | "week" | "day" | "list";

export interface ClientSettings {
  cooldownDays: number;
  accentColor: string;
  theme: ThemeValue;
  timezone: string;
  defaultView: CalendarView;
}

export interface DashboardStats {
  totalContent: number;
  readyContent: number;
  draftContent: number;
  scheduledContent: number;
  postedContent: number;
  archivedContent: number;
  platformStats: PlatformStat[];
  mostUsed: ContentUsageStat[];
  leastUsed: ContentUsageStat[];
  reusable: number;
  cooldownContent: number;
}

export interface PlatformStat {
  id: string;
  name: string;
  icon: string;
  color: string;
  scheduledCount: number;
  postedCount: number;
}

export interface ContentUsageStat {
  id: string;
  contentId: string;
  name: string;
  contentType: ContentTypeValue;
  usageCount: number;
  lastPostedDate: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps: {
    contentId: string;
    contentDbId: string;
    contentName: string;
    platformId: string;
    platformName: string;
    platformColor: string;
    contentType: ContentTypeValue;
    status: ScheduleStatusValue;
    scheduledTime: string;
  };
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface GenerateScheduleResult {
  created: number;
  skipped: number;
  conflicts: string[];
}
