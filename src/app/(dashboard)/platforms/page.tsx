"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Clock,
  Trash2,
  X,
  Globe,
  Film,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatTime } from "@/lib/utils";

interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
  isActive: boolean;
  isCustom: boolean;
  contentTypes: Array<{
    id: string;
    contentType: string;
    isAllowed: boolean;
    allowedDays?: string;
  }>;
  postingSlots: Array<{
    id: string;
    time: string;
    isActive: boolean;
  }>;
  _count?: { schedules: number };
}

const contentTypeConfig = [
  { type: "REEL", label: "Reels", icon: Film, code: "R" },
  { type: "IMAGE", label: "Image / Carousel", icon: ImageIcon, code: "I" },
  { type: "VIDEO", label: "Long Video", icon: Video, code: "V" },
];

const DAYS_OF_WEEK = [
  { value: 1, label: "M", fullName: "Monday" },
  { value: 2, label: "T", fullName: "Tuesday" },
  { value: 3, label: "W", fullName: "Wednesday" },
  { value: 4, label: "T", fullName: "Thursday" },
  { value: 5, label: "F", fullName: "Friday" },
  { value: 6, label: "S", fullName: "Saturday" },
  { value: 0, label: "S", fullName: "Sunday" },
];

export default function PlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPlatform, setShowAddPlatform] = useState(false);
  const [newPlatformName, setNewPlatformName] = useState("");
  const [newPlatformColor, setNewPlatformColor] = useState("#6366f1");
  const [addingSlot, setAddingSlot] = useState<string | null>(null);
  const [newSlotTime, setNewSlotTime] = useState("09:00");

  useEffect(() => {
    fetchPlatforms();
  }, []);

  async function fetchPlatforms() {
    try {
      const res = await fetch("/api/platforms");
      if (res.ok) {
        const data = await res.json();
        setPlatforms(data.platforms);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateContentTypeRule(
    platformId: string,
    contentType: string,
    isAllowed: boolean,
    allowedDays?: string
  ) {
    try {
      await fetch(`/api/platforms/${platformId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentTypes: [{ contentType, isAllowed, allowedDays }],
        }),
      });
      fetchPlatforms();
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function togglePlatform(platformId: string, isActive: boolean) {
    try {
      await fetch(`/api/platforms/${platformId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchPlatforms();
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function addPostingSlot(platformId: string) {
    try {
      await fetch(`/api/platforms/${platformId}/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ time: newSlotTime }),
      });
      setAddingSlot(null);
      setNewSlotTime("09:00");
      fetchPlatforms();
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function deleteSlot(platformId: string, slotId: string) {
    try {
      await fetch(`/api/platforms/${platformId}/slots/${slotId}`, {
        method: "DELETE",
      });
      fetchPlatforms();
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function addPlatform() {
    if (!newPlatformName.trim()) return;
    try {
      await fetch("/api/platforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPlatformName,
          color: newPlatformColor,
        }),
      });
      setShowAddPlatform(false);
      setNewPlatformName("");
      fetchPlatforms();
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function deletePlatform(id: string) {
    if (!confirm("Are you sure? This will delete all schedules for this platform.")) return;
    try {
      await fetch(`/api/platforms/${id}`, { method: "DELETE" });
      fetchPlatforms();
    } catch (error) {
      console.error("Error:", error);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-48 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
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
          <h1 className="text-2xl font-bold tracking-tight">Platforms</h1>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
            Manage platforms, content types, and posting times
          </p>
        </div>
        <Button onClick={() => setShowAddPlatform(true)} className="gap-1.5">
          <Plus className="w-4 h-4" />
          Add Platform
        </Button>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((platform) => (
          <motion.div
            key={platform.id}
            layout
            className="glass-card p-5 space-y-4"
          >
            {/* Platform Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: platform.color }}
                >
                  {platform.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{platform.name}</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {platform._count?.schedules || 0} schedules
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={platform.isActive}
                  onCheckedChange={() => togglePlatform(platform.id, platform.isActive)}
                />
                {platform.isCustom && (
                  <button
                    onClick={() => deletePlatform(platform.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Content Type Rules */}
            <div>
              <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">
                Allowed Content Types
              </p>
              <div className="space-y-3">
                {contentTypeConfig.map((ct) => {
                  const rule = platform.contentTypes.find(
                    (r) => r.contentType === ct.type
                  );
                  const isAllowed = rule?.isAllowed ?? true;
                  const allowedDaysStr = rule?.allowedDays ?? "0,1,2,3,4,5,6";
                  const allowedDaysArray = allowedDaysStr.split(",").filter(Boolean).map(Number);
                  const Icon = ct.icon;

                  return (
                    <div
                      key={ct.type}
                      className="py-1 border-b border-[var(--color-border-subtle)] last:border-0 pb-2 last:pb-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                          <span className="text-sm font-medium">{ct.label}</span>
                        </div>
                        <Checkbox
                          checked={isAllowed}
                          onCheckedChange={() =>
                            updateContentTypeRule(platform.id, ct.type, !isAllowed, rule?.allowedDays)
                          }
                        />
                      </div>
                      {isAllowed && (
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
                            Posting Days
                          </span>
                          <div className="flex gap-1">
                            {DAYS_OF_WEEK.map((day) => {
                              const isSelected = allowedDaysArray.includes(day.value);
                              return (
                                <button
                                  key={day.value}
                                  onClick={() => {
                                    const nextDays = isSelected
                                      ? allowedDaysArray.filter((d) => d !== day.value)
                                      : [...allowedDaysArray, day.value];
                                    updateContentTypeRule(
                                      platform.id,
                                      ct.type,
                                      isAllowed,
                                      nextDays.sort((a, b) => a - b).join(",")
                                    );
                                  }}
                                  className={`w-6 h-6 rounded-md text-[10px] font-semibold flex items-center justify-center transition-all ${
                                    isSelected
                                      ? "text-white shadow-sm font-bold scale-105"
                                      : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border)]"
                                  }`}
                                  style={isSelected ? { backgroundColor: platform.color } : {}}
                                  title={`Toggle ${day.fullName}`}
                                >
                                  {day.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Posting Slots */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                  Posting Times
                </p>
                <button
                  onClick={() => setAddingSlot(addingSlot === platform.id ? null : platform.id)}
                  className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                >
                  + Add Time
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {platform.postingSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] group"
                  >
                    <Clock className="w-3 h-3 text-[var(--color-text-muted)]" />
                    <span className="text-xs font-medium">{formatTime(slot.time)}</span>
                    <button
                      onClick={() => deleteSlot(platform.id, slot.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-[var(--color-text-muted)] hover:text-red-400" />
                    </button>
                  </div>
                ))}
                {platform.postingSlots.length === 0 && (
                  <p className="text-xs text-[var(--color-text-muted)]">No posting times set</p>
                )}
              </div>

              {/* Add Slot Inline */}
              <AnimatePresence>
                {addingSlot === platform.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 mt-2"
                  >
                    <Input
                      type="time"
                      value={newSlotTime}
                      onChange={(e) => setNewSlotTime(e.target.value)}
                      className="w-32 h-8 text-xs"
                    />
                    <Button
                      size="sm"
                      onClick={() => addPostingSlot(platform.id)}
                      className="h-8 text-xs"
                    >
                      Add
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAddingSlot(null)}
                      className="h-8 text-xs"
                    >
                      Cancel
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Platform Dialog */}
      <Dialog open={showAddPlatform} onOpenChange={setShowAddPlatform}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Platform</DialogTitle>
            <DialogDescription>Create a new platform for scheduling</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Platform Name</Label>
              <Input
                placeholder="e.g. Pinterest, Threads"
                value={newPlatformName}
                onChange={(e) => setNewPlatformName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Brand Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={newPlatformColor}
                  onChange={(e) => setNewPlatformColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                />
                <Input
                  value={newPlatformColor}
                  onChange={(e) => setNewPlatformColor(e.target.value)}
                  className="w-32"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAddPlatform(false)}>
                Cancel
              </Button>
              <Button onClick={addPlatform}>
                Add Platform
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
