"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Save, Palette, Timer, Globe, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/components/providers/theme-provider";

const timezones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [cooldownDays, setCooldownDays] = useState(30);
  const [accentColor, setAccentColor] = useState("#6366f1");
  const [timezone, setTimezone] = useState("UTC");
  const [defaultView, setDefaultView] = useState("month");
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setCooldownDays(data.settings.cooldownDays);
        setAccentColor(data.settings.accentColor);
        setTimezone(data.settings.timezone);
        setDefaultView(data.settings.defaultView);
        setClientName(data.settings.clientName);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cooldownDays,
          accentColor,
          theme,
          timezone,
          defaultView,
          clientName,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="skeleton h-10 w-48 rounded-lg" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
            Configure your ContentFlow preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          <Save className="w-3.5 h-3.5" />
          {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Client Info */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <SettingsIcon className="w-4 h-4 text-[var(--color-accent)]" />
          Client Profile
        </h3>
        <div className="space-y-2">
          <Label htmlFor="clientName">Brand / Company Name</Label>
          <Input
            id="clientName"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </div>
      </div>

      {/* Scheduling */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Timer className="w-4 h-4 text-[var(--color-accent)]" />
          Scheduling
        </h3>
        <div className="space-y-2">
          <Label htmlFor="cooldown">Content Cooldown (days)</Label>
          <p className="text-xs text-[var(--color-text-muted)]">
            Minimum days before reusing content. Content posted on June 1 with 30-day cooldown becomes eligible again on July 1.
          </p>
          <Input
            id="cooldown"
            type="number"
            min={1}
            max={365}
            value={cooldownDays}
            onChange={(e) => setCooldownDays(parseInt(e.target.value) || 30)}
            className="w-32"
          />
        </div>
      </div>

      {/* Appearance */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Palette className="w-4 h-4 text-[var(--color-accent)]" />
          Appearance
        </h3>
        <div className="space-y-2">
          <Label>Theme</Label>
          <Select value={theme} onValueChange={(v) => setTheme(v as "dark" | "light" | "system")}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Accent Color</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="w-10 h-10 rounded-lg border-0 cursor-pointer"
            />
            <Input
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="w-32"
            />
          </div>
        </div>
      </div>

      {/* Regional */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Globe className="w-4 h-4 text-[var(--color-accent)]" />
          Regional
        </h3>
        <div className="space-y-2">
          <Label>Timezone</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz} value={tz}>{tz}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Default Calendar View</Label>
          <Select value={defaultView} onValueChange={setDefaultView}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="list">Agenda</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </motion.div>
  );
}
