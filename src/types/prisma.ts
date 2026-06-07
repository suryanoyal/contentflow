export type Role = "ADMIN" | "MANAGER" | "EDITOR" | "VIEWER";
export type ContentType = "REEL" | "IMAGE" | "VIDEO";
export type ContentStatus = "DRAFT" | "READY" | "SCHEDULED" | "POSTED" | "ARCHIVED";
export type ScheduleStatus = "SCHEDULED" | "POSTED" | "FAILED" | "CANCELLED";
export type NotificationType = "SCHEDULE_GENERATED" | "COOLDOWN_EXPIRED" | "CONFLICT_DETECTED" | "CONTENT_SHORTAGE" | "SCHEDULE_UPDATED";
