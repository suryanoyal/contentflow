/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
 
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ChevronDown,
  X,
  Check,
  AlertCircle,
  Film,
  Image as ImageIcon,
  Video as VideoIcon,
  Globe,
  Loader2,
  Calendar,
  Clock,
  Layers,
  Edit2,
  Trash,
  CheckCircle,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { addDays, format, startOfWeek, endOfWeek, addWeeks } from "date-fns";
import { CalendarEvent } from "@/types";
import { cn, formatDate, formatTime, getContentTypeLabel } from "@/lib/utils";
 
// Custom SVG Icons for Brands since lucide-react deprecated them in v0.400+
const InstagramIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const LinkedInIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const TwitterIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const TikTokIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const YouTubeIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.56 49.56 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
    <polygon points="10 15 15 12 10 9" />
  </svg>
);

// Dynamically import FullCalendar to avoid SSR issues
const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
 
function getPlatformIconComponent(name: string) {
  switch (name) {
    case "Instagram": return InstagramIcon;
    case "Facebook": return FacebookIcon;
    case "LinkedIn": return LinkedInIcon;
    case "X": return TwitterIcon;
    case "TikTok": return TikTokIcon;
    case "YouTube": return YouTubeIcon;
    default: return Globe;
  }
}
 
function getContentIconComponent(type: string) {
  switch (type) {
    case "REEL": return Film;
    case "IMAGE": return ImageIcon;
    case "VIDEO": return VideoIcon;
    default: return Film;
  }
}
 
function getStatusBadgeClass(status: string) {
  switch (status) {
    case "DRAFT":
      return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    case "READY":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "SCHEDULED":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "POSTED":
      return "bg-violet-500/10 text-violet-400 border-violet-500/20";
    case "ARCHIVED":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "FAILED":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "CANCELLED":
      return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    default:
      return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  }
}
 
export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateResult, setGenerateResult] = useState<{
    created: number;
    skipped: number;
    conflicts: string[];
  } | null>(null);
  
  // Dialog states
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form states
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editPlatformId, setEditPlatformId] = useState("");
  const [editContentDbId, setEditContentDbId] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [savingForm, setSavingForm] = useState(false);
  const [formError, setFormError] = useState("");
 
  // Platform & Content lists for select inputs
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [contents, setContents] = useState<any[]>([]);
 
  // Filter states
  const [filterPlatformId, setFilterPlatformId] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
 
  // State for Auto Schedule platform filter selection
  const [autoSchedulePlatformId, setAutoSchedulePlatformId] = useState<string>("all");
 
  // Date range tracking to re-fetch correctly without triggering re-render cascades
  const rangeRef = useRef<{ start: string; end: string } | null>(null);
 
  const fetchSchedules = useCallback(async (start?: string, end?: string) => {
    try {
      const activeStart = start || rangeRef.current?.start;
      const activeEnd = end || rangeRef.current?.end;
      
      const params = new URLSearchParams();
      if (activeStart) params.set("start", activeStart);
      if (activeEnd) params.set("end", activeEnd);
 
      const res = await fetch(`/api/schedules?${params}`);
      if (res.ok) {
        const data = await res.json();
        const calEvents: CalendarEvent[] = data.schedules.map(
          (s: Record<string, unknown>) => {
            const content = s.content as Record<string, unknown>;
            const platform = s.platform as Record<string, unknown>;
            const dateStr = (s.scheduledDate as string).split("T")[0];
            const timeStr = s.scheduledTime as string;
            return {
              id: s.id as string,
              title: `${content.contentId} — ${(platform.name as string)}`,
              start: `${dateStr}T${timeStr}:00`,
              backgroundColor: `${platform.color}15`,
              borderColor: platform.color as string,
              textColor: platform.color as string,
              extendedProps: {
                contentId: content.contentId as string,
                contentDbId: content.id as string,
                contentName: content.name as string,
                platformId: platform.id as string,
                platformName: platform.name as string,
                platformColor: platform.color as string,
                contentType: content.contentType as string,
                status: s.status as string,
                scheduledTime: timeStr,
              },
            };
          }
        );
        setEvents(calEvents);
        
        if (start && end) {
          rangeRef.current = { start, end };
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);
 
  const loadFormData = useCallback(async () => {
    try {
      const [platRes, contRes] = await Promise.all([
        fetch("/api/platforms"),
        fetch("/api/content?limit=100")
      ]);
      if (platRes.ok) {
        const platData = await platRes.json();
        // Use active platforms
        setPlatforms(platData.platforms.filter((p: any) => p.isActive));
      }
      if (contRes.ok) {
        const contData = await contRes.json();
        // Use READY, SCHEDULED, and POSTED content
        setContents(contData.contents.filter((c: any) => ["READY", "SCHEDULED", "POSTED"].includes(c.status)));
      }
    } catch (error) {
      console.error("Error loading form data:", error);
    }
  }, []);
 
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFormData();
  }, [loadFormData]);
 
  const handleDatesSet = useCallback((dateInfo: { startStr: string; endStr: string }) => {
    fetchSchedules(dateInfo.startStr, dateInfo.endStr);
  }, [fetchSchedules]);
 
  // Stats calculation
  const stats = useMemo(() => {
    const total = events.length;
    const scheduled = events.filter(e => e.extendedProps.status === "SCHEDULED").length;
    const posted = events.filter(e => e.extendedProps.status === "POSTED").length;
    const failed = events.filter(e => e.extendedProps.status === "FAILED").length;
    
    // Unique platforms with events
    const activePlats = new Set(events.map(e => e.extendedProps.platformId)).size;
    
    return { total, scheduled, posted, failed, activePlats };
  }, [events]);
 
  // In-memory filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchPlat = filterPlatformId === "all" || e.extendedProps.platformId === filterPlatformId;
      const matchStatus = filterStatus === "all" || e.extendedProps.status === filterStatus;
      return matchPlat && matchStatus;
    });
  }, [events, filterPlatformId, filterStatus]);
 
  async function handleGenerate(mode: "this-week" | "next-week" | "next-30" | "next-90", platformId?: string) {
    setGenerating(true);
    try {
      let startDate: Date;
      let endDate: Date;
 
      const now = new Date();
      if (mode === "this-week") {
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
      } else if (mode === "next-week") {
        const nextWeek = addWeeks(now, 1);
        startDate = startOfWeek(nextWeek, { weekStartsOn: 1 });
        endDate = endOfWeek(nextWeek, { weekStartsOn: 1 });
      } else if (mode === "next-30") {
        startDate = now;
        endDate = addDays(now, 30);
      } else {
        startDate = now;
        endDate = addDays(now, 90);
      }
 
      const res = await fetch("/api/schedules/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          platformId: platformId === "all" ? undefined : platformId,
        }),
      });
 
      if (res.ok) {
        const result = await res.json();
        setGenerateResult(result);
        fetchSchedules();
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setGenerating(false);
    }
  }
 
  async function handleEventDrop(info: Record<string, unknown>) {
    const event = info.event as Record<string, unknown>;
    const eventId = event.id as string;
    const newStart = event.start as Date;
 
    try {
      const res = await fetch(`/api/schedules/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledDate: newStart.toISOString().split("T")[0],
          scheduledTime: format(newStart, "HH:mm"),
        }),
      });
 
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Cannot move this event");
        (info as Record<string, unknown> & { revert: () => void }).revert();
      } else {
        fetchSchedules();
      }
    } catch {
      (info as Record<string, unknown> & { revert: () => void }).revert();
    }
  }
 
  async function handleDeleteSchedule(id: string) {
    try {
      await fetch(`/api/schedules/${id}`, { method: "DELETE" });
      setSelectedEvent(null);
      fetchSchedules();
    } catch (error) {
      console.error("Error:", error);
    }
  }
 
  // Handle dragging/selection of calendar grid
  const handleDateSelect = (selectInfo: any) => {
    const startStr = selectInfo.startStr.split("T")[0];
    
    // Set default form values
    setEditDate(startStr);
    setEditTime("10:00");
    if (platforms.length > 0) setEditPlatformId(platforms[0].id);
    if (contents.length > 0) setEditContentDbId(contents[0].id);
    setEditStatus("SCHEDULED");
    
    setIsCreating(true);
    setIsEditing(false);
    setFormError("");
  };
 
  // Save manual scheduling or edits
  async function handleSaveForm() {
    setSavingForm(true);
    setFormError("");
    try {
      if (isCreating) {
        const res = await fetch("/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentDbId: editContentDbId,
            platformId: editPlatformId,
            scheduledDate: editDate,
            scheduledTime: editTime,
          }),
        });
        
        if (res.ok) {
          setIsCreating(false);
          fetchSchedules();
        } else {
          const data = await res.json();
          setFormError(data.error || "Failed to create schedule");
        }
      } else if (isEditing && selectedEvent) {
        const res = await fetch(`/api/schedules/${selectedEvent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentDbId: editContentDbId,
            platformId: editPlatformId,
            scheduledDate: editDate,
            scheduledTime: editTime,
            status: editStatus,
          }),
        });
        
        if (res.ok) {
          setIsEditing(false);
          setSelectedEvent(null);
          fetchSchedules();
        } else {
          const data = await res.json();
          setFormError(data.error || "Failed to update schedule");
        }
      }
    } catch {
      setFormError("An error occurred. Please try again.");
    } finally {
      setSavingForm(false);
    }
  }
 
  const renderEventContent = (eventInfo: any) => {
    const ep = eventInfo.event.extendedProps;
    const viewType = eventInfo.view.type;
 
    const platformName = ep.platformName || "";
    const platformColor = ep.platformColor || "var(--color-accent)";
    const contentType = ep.contentType || "REEL";
    const contentId = ep.contentId || "";
    const title = ep.contentName || eventInfo.event.title;
    const status = ep.status || "SCHEDULED";
    const time = ep.scheduledTime || "";
 
    const PlatformIcon = getPlatformIconComponent(platformName);
    const ContentIcon = getContentIconComponent(contentType);
 
    if (viewType === "dayGridMonth") {
      return (
        <div
          className="flex items-center gap-1 w-full overflow-hidden py-0.5 px-1 rounded transition-all h-full"
          style={{
            backgroundColor: `${platformColor}12`,
            borderLeft: `2.5px solid ${platformColor}`,
            color: "var(--color-text-primary)",
          }}
        >
          <span className="shrink-0 text-[8px] opacity-70 font-mono">{time}</span>
          <span className="shrink-0" style={{ color: platformColor }}>
            <PlatformIcon className="w-2.5 h-2.5" />
          </span>
          <span className="truncate text-[10px] font-medium">{title}</span>
        </div>
      );
    }
 
    return (
      <div
        className="flex flex-col gap-1 w-full h-full p-1.5 rounded overflow-hidden transition-all text-left"
        style={{
          backgroundColor: `${platformColor}12`,
          borderLeft: `3px solid ${platformColor}`,
          color: "var(--color-text-primary)",
        }}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-[9px] font-mono bg-zinc-900/60 px-1 py-0.2 rounded text-[var(--color-text-secondary)]">{time}</span>
          <div className="flex items-center gap-1">
            <span style={{ color: platformColor }} className="bg-zinc-900/40 p-0.5 rounded">
              <PlatformIcon className="w-3 h-3" />
            </span>
            <span className="text-[9px] font-medium opacity-80 truncate text-[var(--color-text-secondary)]">{platformName}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-mono text-[var(--color-accent)] font-semibold">{contentId}</span>
          <span className="text-[var(--color-text-muted)]"><ContentIcon className="w-2.5 h-2.5" /></span>
        </div>
        <div className="text-xs font-medium leading-tight text-[var(--color-text-primary)] line-clamp-2 truncate mt-0.5">{title}</div>
        <div className="mt-auto pt-1 flex items-center justify-between border-t border-white/5">
          <span className={`text-[8px] font-semibold px-1 rounded border ${getStatusBadgeClass(status)}`}>
            {status}
          </span>
        </div>
      </div>
    );
  };
 
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
            Manage your content schedule
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading && events.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)] bg-zinc-900/40 px-2.5 py-1.5 rounded-lg border border-[var(--color-border-subtle)] transition-all">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-accent)]" />
              <span className="font-medium">Syncing...</span>
            </div>
          )}
          <div className="relative">
            <Button
              onClick={() => setShowGenerate(!showGenerate)}
              className="gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto Schedule
              <ChevronDown className="w-3 h-3" />
            </Button>
 
            <AnimatePresence>
              {showGenerate && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  className="absolute right-0 top-12 glass-strong rounded-xl shadow-2xl p-4.5 z-50 w-64 border border-[var(--color-border)]"
                >
                  <p className="text-xs text-[var(--color-text-tertiary)] mb-2 font-semibold">
                    1. Select Target Channel:
                  </p>
                  <select
                    value={autoSchedulePlatformId}
                    onChange={(e) => setAutoSchedulePlatformId(e.target.value)}
                    className="w-full mb-4 px-2.5 py-1.5 rounded-lg text-xs bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
                  >
                    <option value="all">All Active Channels</option>
                    {platforms.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
 
                  <p className="text-xs text-[var(--color-text-tertiary)] mb-2 font-semibold">
                    2. Choose Date Range:
                  </p>
                  <div className="space-y-1.5">
                    {(
                      [
                        { label: "This Week (Mon - Sun)", mode: "this-week" },
                        { label: "Next Week (Mon - Sun)", mode: "next-week" },
                        { label: "Next 30 Days", mode: "next-30" },
                        { label: "Next 90 Days", mode: "next-90" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.mode}
                        onClick={() => {
                          handleGenerate(opt.mode, autoSchedulePlatformId);
                          setShowGenerate(false);
                        }}
                        disabled={generating}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors border border-transparent hover:border-[var(--color-border-subtle)]"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
 
      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-xs text-[var(--color-text-tertiary)] font-medium">Total Scheduled</p>
          <p className="text-2xl font-bold mt-1 text-[var(--color-text-primary)]">{stats.total}</p>
          <div className="absolute right-4 bottom-4 text-indigo-500/10"><Calendar className="w-8 h-8" /></div>
        </div>
        <div className="stat-card">
          <p className="text-xs text-[var(--color-text-tertiary)] font-medium">Pending Posts</p>
          <p className="text-2xl font-bold mt-1 text-sky-400">{stats.scheduled}</p>
          <div className="absolute right-4 bottom-4 text-sky-500/10"><Clock className="w-8 h-8" /></div>
        </div>
        <div className="stat-card">
          <p className="text-xs text-[var(--color-text-tertiary)] font-medium">Published Posts</p>
          <p className="text-2xl font-bold mt-1 text-emerald-400">{stats.posted}</p>
          <div className="absolute right-4 bottom-4 text-emerald-500/10"><CheckCircle className="w-8 h-8" /></div>
        </div>
        <div className="stat-card">
          <p className="text-xs text-[var(--color-text-tertiary)] font-medium">Active Channels</p>
          <p className="text-2xl font-bold mt-1 text-violet-400">{stats.activePlats}</p>
          <div className="absolute right-4 bottom-4 text-violet-500/10"><Layers className="w-8 h-8" /></div>
        </div>
      </div>
 
      {/* Filters bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-[var(--color-bg-secondary)] p-3 rounded-xl border border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[var(--color-text-tertiary)] font-medium flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Filter Channels:
          </span>
          <button
            onClick={() => setFilterPlatformId("all")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold transition-all border cursor-pointer",
              filterPlatformId === "all"
                ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30"
                : "bg-transparent text-[var(--color-text-secondary)] border-transparent hover:border-[var(--color-border)]"
            )}
          >
            All
          </button>
          {platforms.map((p) => (
            <button
              key={p.id}
              onClick={() => setFilterPlatformId(p.id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer",
                filterPlatformId === p.id
                  ? "bg-[var(--color-bg-active)] border-opacity-100"
                  : "bg-transparent border-transparent hover:border-[var(--color-border)]"
              )}
              style={{
                borderColor: filterPlatformId === p.id ? p.color : "transparent",
                color: filterPlatformId === p.id ? p.color : "var(--color-text-secondary)"
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
              {p.name}
            </button>
          ))}
        </div>
 
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-tertiary)] font-semibold">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1 rounded-lg text-xs bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)]"
          >
            <option value="all">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="POSTED">Posted</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>
 
      {/* Generate Result Notification */}
      <AnimatePresence>
        {generateResult && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass-card p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-sm font-medium">
                  Generated {generateResult.created} schedule entries
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {generateResult.skipped} slots skipped • {generateResult.conflicts.length} conflicts
                </p>
              </div>
            </div>
            <button
              onClick={() => setGenerateResult(null)}
              className="p-1 hover:bg-[var(--color-bg-hover)] rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* Calendar Grid */}
      <div className="glass-card p-4">
        {loading && events.length === 0 ? (
          <div className="space-y-4 py-8">
            <div className="flex items-center justify-between">
              <div className="skeleton h-8 w-48 rounded" />
              <div className="skeleton h-8 w-72 rounded" />
            </div>
            <div className="skeleton h-[500px] w-full rounded-xl" />
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            events={filteredEvents}
            editable={true}
            droppable={true}
            eventDrop={handleEventDrop as never}
            eventClick={((info: { event: { id: string; title: string; start: Date | null; startStr: string; extendedProps: Record<string, unknown> } }) => {
              const ep = info.event.extendedProps as unknown as CalendarEvent["extendedProps"];
              setSelectedEvent({
                id: info.event.id,
                title: info.event.title,
                start: info.event.start?.toISOString() || "",
                extendedProps: ep,
              });
              
              // Prefill form states for editing
              setEditDate(info.event.startStr.split("T")[0]);
              setEditTime(ep.scheduledTime);
              setEditPlatformId(ep.platformId);
              setEditContentDbId(ep.contentDbId);
              setEditStatus(ep.status);
              setIsEditing(false);
              setIsCreating(false);
              setFormError("");
            }) as never}
            datesSet={handleDatesSet as never}
            eventContent={renderEventContent}
            selectable={true}
            select={handleDateSelect}
            height="auto"
            dayMaxEvents={4}
            nowIndicator={true}
          />
        )}
      </div>
 
      {/* Dialog for Edit, View and Create */}
      <Dialog 
        open={!!selectedEvent || isCreating} 
        onOpenChange={() => { 
          setSelectedEvent(null); 
          setIsCreating(false); 
          setIsEditing(false); 
          setFormError("");
        }}
      >
        <DialogContent className="glass-strong border-[var(--color-border)] text-[var(--color-text-primary)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {isCreating ? "Schedule New Post" : isEditing ? "Edit Scheduled Post" : "Schedule Details"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[var(--color-text-tertiary)]">
              {isCreating 
                ? "Manually add a content piece to your scheduling calendar" 
                : isEditing 
                  ? "Modify date, time, platform, content, or status of this post" 
                  : "View and manage this scheduled post"}
            </DialogDescription>
          </DialogHeader>
 
          {/* Create or Edit Form */}
          {(isCreating || isEditing) ? (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-xs text-[var(--color-text-secondary)]">Date</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={editDate} 
                    onChange={(e) => setEditDate(e.target.value)} 
                    className="glass-input text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="time" className="text-xs text-[var(--color-text-secondary)]">Time</Label>
                  <Input 
                    id="time" 
                    type="time" 
                    value={editTime} 
                    onChange={(e) => setEditTime(e.target.value)} 
                    className="glass-input text-xs"
                  />
                </div>
              </div>
 
              <div className="space-y-1.5">
                <Label htmlFor="platform" className="text-xs text-[var(--color-text-secondary)]">Social Channel</Label>
                <Select value={editPlatformId} onValueChange={setEditPlatformId}>
                  <SelectTrigger id="platform" className="glass-input text-xs">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-[var(--color-border)] text-xs">
                    {platforms.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                          <span>{p.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
 
              <div className="space-y-1.5">
                <Label htmlFor="content" className="text-xs text-[var(--color-text-secondary)]">Content Item</Label>
                <Select value={editContentDbId} onValueChange={setEditContentDbId}>
                  <SelectTrigger id="content" className="glass-input text-xs h-auto min-h-[38px] py-1.5">
                    <SelectValue placeholder="Select content" />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-[var(--color-border)] text-xs max-h-60">
                    {contents.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex flex-col text-left py-0.5">
                          <span className="font-semibold text-xs text-[var(--color-text-primary)]">{c.name}</span>
                          <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">{c.contentId} • {getContentTypeLabel(c.contentType)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
 
              {isEditing && (
                <div className="space-y-1.5">
                  <Label htmlFor="status" className="text-xs text-[var(--color-text-secondary)]">Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger id="status" className="glass-input text-xs">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="glass-strong border-[var(--color-border)] text-xs">
                      <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                      <SelectItem value="POSTED">Posted</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
 
              {formError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{formError}</span>
                </p>
              )}
 
              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    if (isCreating) setIsCreating(false);
                    else setIsEditing(false);
                  }}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSaveForm}
                  disabled={savingForm || !editPlatformId || !editContentDbId || !editDate || !editTime}
                  className="text-xs gap-1.5"
                >
                  {savingForm && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          ) : selectedEvent ? (
            <div className="space-y-4">
              <div className="space-y-3 py-1">
                <div className="flex justify-between items-center text-sm border-b border-[var(--color-border-subtle)] pb-2">
                  <span className="text-[var(--color-text-tertiary)]">Content ID</span>
                  <Link 
                    href={`/content/${selectedEvent.extendedProps.contentDbId}`}
                    className="font-mono text-xs font-semibold text-[var(--color-accent)] hover:underline flex items-center gap-1"
                  >
                    {selectedEvent.extendedProps.contentId}
                  </Link>
                </div>
                <div className="flex justify-between text-sm border-b border-[var(--color-border-subtle)] pb-2">
                  <span className="text-[var(--color-text-tertiary)]">Content Name</span>
                  <span className="font-medium text-right max-w-[200px] truncate">{selectedEvent.extendedProps.contentName}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-[var(--color-border-subtle)] pb-2">
                  <span className="text-[var(--color-text-tertiary)]">Platform</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedEvent.extendedProps.platformColor }} />
                    <span className="font-medium">{selectedEvent.extendedProps.platformName}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm border-b border-[var(--color-border-subtle)] pb-2">
                  <span className="text-[var(--color-text-tertiary)]">Scheduled Date</span>
                  <span className="font-medium">{formatDate(selectedEvent.start)}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-[var(--color-border-subtle)] pb-2">
                  <span className="text-[var(--color-text-tertiary)]">Scheduled Time</span>
                  <span className="font-medium">{formatTime(selectedEvent.extendedProps.scheduledTime)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-tertiary)]">Status</span>
                  <Badge className={cn("text-[10px] font-semibold", getStatusBadgeClass(selectedEvent.extendedProps.status))}>
                    {selectedEvent.extendedProps.status}
                  </Badge>
                </div>
              </div>
              <div className="flex justify-between gap-2 pt-4 border-t border-[var(--color-border-subtle)]">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteSchedule(selectedEvent.id)}
                  className="text-xs gap-1.5"
                >
                  <Trash className="w-3.5 h-3.5" />
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="text-xs gap-1.5">
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Details
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedEvent(null)} className="text-xs">
                    Close
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
