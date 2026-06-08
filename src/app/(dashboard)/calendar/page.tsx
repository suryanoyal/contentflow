"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Sparkles,
  ChevronDown,
  X,
  Check,
  AlertCircle,
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
import { addDays, format, startOfWeek, endOfWeek, addWeeks } from "date-fns";
import { CalendarEvent } from "@/types";

// Dynamically import FullCalendar to avoid SSR issues
const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";

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
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);


  const fetchSchedules = useCallback(async (start?: string, end?: string) => {
    try {
      const params = new URLSearchParams();
      if (start) params.set("start", start);
      if (end) params.set("end", end);

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
              backgroundColor: `${platform.color}20`,
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
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSchedules(start.toISOString(), end.toISOString());
  }, [fetchSchedules]);

  async function handleGenerate(mode: "this-week" | "next-week" | "next-30" | "next-90") {
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
                  className="absolute right-0 top-12 glass-strong rounded-xl shadow-2xl p-3 z-50 w-56"
                >
                  <p className="text-xs text-[var(--color-text-tertiary)] mb-2 font-medium">
                    Generate schedule for:
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
                          handleGenerate(opt.mode);
                          setShowGenerate(false);
                        }}
                        disabled={generating}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors"
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

      {/* Generate Result */}
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
              className="p-1 hover:bg-[var(--color-bg-hover)] rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar */}
      <div className="glass-card p-4">
        {!loading && (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            events={events}
            editable={true}
            droppable={true}
            eventDrop={handleEventDrop as never}
            eventClick={((info: { event: { id: string; title: string; start: Date | null; extendedProps: Record<string, unknown> } }) => {
              const ep = info.event.extendedProps as unknown as CalendarEvent["extendedProps"];
              setSelectedEvent({
                id: info.event.id,
                title: info.event.title,
                start: info.event.start?.toISOString() || "",
                extendedProps: ep,
              });
            }) as never}
            height="auto"
            dayMaxEvents={4}
            nowIndicator={true}
            selectable={true}
          />
        )}
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Details</DialogTitle>
            <DialogDescription>View and manage this scheduled post</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-tertiary)]">Content ID</span>
                  <span className="font-mono text-[var(--color-accent)]">
                    {selectedEvent.extendedProps.contentId}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-tertiary)]">Content</span>
                  <span className="font-medium">{selectedEvent.extendedProps.contentName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-tertiary)]">Platform</span>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedEvent.extendedProps.platformColor }}
                    />
                    <span>{selectedEvent.extendedProps.platformName}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-tertiary)]">Time</span>
                  <span>{selectedEvent.extendedProps.scheduledTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-tertiary)]">Status</span>
                  <Badge variant="secondary">{selectedEvent.extendedProps.status}</Badge>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-border-subtle)]">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteSchedule(selectedEvent.id)}
                >
                  Delete
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedEvent(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
