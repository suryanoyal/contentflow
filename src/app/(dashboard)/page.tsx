"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  CheckCircle2,
  Clock,
  Send,
  Archive,
  Edit3,
  TrendingUp,
  RefreshCw,
  Timer,
  Sparkles,
  Plus,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DashboardStats } from "@/types";
import { getContentTypeLabel, formatDate } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setActivity(data.recentActivity || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total", value: stats?.totalContent || 0, icon: FileText, color: "from-blue-500 to-cyan-500" },
    { label: "Ready", value: stats?.readyContent || 0, icon: CheckCircle2, color: "from-emerald-500 to-green-500" },
    { label: "Draft", value: stats?.draftContent || 0, icon: Edit3, color: "from-zinc-500 to-gray-500" },
    { label: "Scheduled", value: stats?.scheduledContent || 0, icon: Clock, color: "from-blue-500 to-indigo-500" },
    { label: "Posted", value: stats?.postedContent || 0, icon: Send, color: "from-violet-500 to-purple-500" },
    { label: "Archived", value: stats?.archivedContent || 0, icon: Archive, color: "from-amber-500 to-orange-500" },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
            Overview of your content and scheduling
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/content/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              New Content
            </Button>
          </Link>
          <Link href="/calendar">
            <Button variant="outline" size="sm" className="gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              Calendar
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="stat-card group">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 opacity-80 group-hover:opacity-100 transition-opacity`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
                {stat.value}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5 font-medium">
                {stat.label}
              </p>
            </div>
          );
        })}
      </motion.div>

      {/* Platform Stats + Usage Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Analytics */}
        <motion.div variants={item} className="glass-card p-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--color-accent)]" />
            Platform Analytics
          </h3>
          <div className="space-y-3">
            {stats?.platformStats?.map((platform) => (
              <div
                key={platform.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: platform.color }}
                  >
                    {platform.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium">{platform.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-[var(--color-text-tertiary)]">
                    {platform.scheduledCount} scheduled
                  </span>
                  <span className="text-emerald-400">
                    {platform.postedCount} posted
                  </span>
                </div>
              </div>
            ))}
            {(!stats?.platformStats || stats.platformStats.length === 0) && (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                No platforms configured yet
              </p>
            )}
          </div>
        </motion.div>

        {/* Usage Analytics */}
        <motion.div variants={item} className="glass-card p-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
            Content Analytics
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 rounded-xl bg-[var(--color-bg-tertiary)]">
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-[var(--color-text-tertiary)]">Reusable</span>
              </div>
              <p className="text-xl font-bold">{stats?.reusable || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-bg-tertiary)]">
              <div className="flex items-center gap-2 mb-1">
                <Timer className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-[var(--color-text-tertiary)]">Cooldown</span>
              </div>
              <p className="text-xl font-bold">{stats?.cooldownContent || 0}</p>
            </div>
          </div>

          {/* Most Used */}
          <div className="mb-3">
            <p className="text-xs font-medium text-[var(--color-text-tertiary)] mb-2 uppercase tracking-wider">
              Most Used
            </p>
            {stats?.mostUsed?.slice(0, 3).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-2 border-b border-[var(--color-border-subtle)] last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[var(--color-accent)]">{c.contentId}</span>
                  <span className="text-xs text-[var(--color-text-secondary)] truncate max-w-32">{c.name}</span>
                </div>
                <Badge variant="secondary">{c.usageCount}x</Badge>
              </div>
            ))}
          </div>

          {/* Least Used */}
          <div>
            <p className="text-xs font-medium text-[var(--color-text-tertiary)] mb-2 uppercase tracking-wider">
              Least Used
            </p>
            {stats?.leastUsed?.slice(0, 3).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-2 border-b border-[var(--color-border-subtle)] last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[var(--color-accent)]">{c.contentId}</span>
                  <span className="text-xs text-[var(--color-text-secondary)] truncate max-w-32">{c.name}</span>
                </div>
                <Badge variant="secondary">{c.usageCount}x</Badge>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div variants={item} className="glass-card p-6">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
          Recent Activity
        </h3>
        <div className="space-y-2">
          {activity.slice(0, 8).map((log: Record<string, unknown>, i: number) => (
            <div
              key={i}
              className="flex items-center gap-3 py-2 border-b border-[var(--color-border-subtle)] last:border-0"
            >
              <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
              <span className="text-xs text-[var(--color-text-secondary)] flex-1">
                <strong>{(log.user as Record<string, unknown>)?.name as string || "User"}</strong> {log.action as string}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {formatDate(log.createdAt as string)}
              </span>
            </div>
          ))}
          {activity.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
              No activity yet. Start by creating content!
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
