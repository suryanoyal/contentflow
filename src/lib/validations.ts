import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  clientName: z.string().min(2, "Client name must be at least 2 characters"),
});

export const contentSchema = z.object({
  name: z.string().min(1, "Content name is required"),
  description: z.string().optional(),
  contentType: z.enum(["REEL", "IMAGE", "VIDEO"]),
  status: z.enum(["DRAFT", "READY", "SCHEDULED", "POSTED", "ARCHIVED"]).optional(),
  notes: z.string().optional(),
});

export const platformSchema = z.object({
  name: z.string().min(1, "Platform name is required"),
  icon: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
  isCustom: z.boolean().optional(),
});

export const postingSlotSchema = z.object({
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:mm format"),
  isActive: z.boolean().optional(),
});

export const scheduleSchema = z.object({
  contentDbId: z.string().min(1, "Content is required"),
  platformId: z.string().min(1, "Platform is required"),
  scheduledDate: z.string().min(1, "Date is required"),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:mm format"),
});

export const generateScheduleSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export const settingsSchema = z.object({
  cooldownDays: z.number().min(1).max(365).optional(),
  accentColor: z.string().optional(),
  theme: z.enum(["dark", "light", "system"]).optional(),
  timezone: z.string().optional(),
  defaultView: z.enum(["month", "week", "day", "list"]).optional(),
});

export const platformContentTypeSchema = z.object({
  contentType: z.enum(["REEL", "IMAGE", "VIDEO"]),
  isAllowed: z.boolean(),
  allowedDays: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ContentInput = z.infer<typeof contentSchema>;
export type PlatformInput = z.infer<typeof platformSchema>;
export type PostingSlotInput = z.infer<typeof postingSlotSchema>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;
export type GenerateScheduleInput = z.infer<typeof generateScheduleSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
