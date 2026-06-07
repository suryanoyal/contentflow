"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { getStatusColor, formatDate, getContentTypeLabel } from "@/lib/utils";

interface ContentDetail {
  id: string;
  contentId: string;
  name: string;
  description: string | null;
  contentType: string;
  status: string;
  usageCount: number;
  lastPostedDate: string | null;
  lastPostedPlatform: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  schedules: Array<{
    id: string;
    scheduledDate: string;
    scheduledTime: string;
    status: string;
    platform: { name: string; color: string };
  }>;
}

export default function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchContent();
  }, [resolvedParams.id]);

  async function fetchContent() {
    try {
      const res = await fetch(`/api/content/${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        setContent(data.content);
        setName(data.content.name);
        setDescription(data.content.description || "");
        setStatus(data.content.status);
        setNotes(data.content.notes || "");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/content/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          contentType: content?.contentType,
          status,
          notes,
        }),
      });

      if (res.ok) {
        fetchContent();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this content?")) return;
    try {
      await fetch(`/api/content/${resolvedParams.id}`, { method: "DELETE" });
      router.push("/content");
    } catch (error) {
      console.error("Error:", error);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="skeleton h-10 w-64 rounded-lg" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--color-text-muted)]">Content not found</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/content">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{content.contentId}</h1>
              <span className={`badge ${getStatusColor(content.status)}`}>{content.status}</span>
            </div>
            <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5">
              {getContentTypeLabel(content.contentType)} • Created {formatDate(content.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="w-3.5 h-3.5 mr-1" /> {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Content Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="READY">Ready</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="POSTED">Posted</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[80px]" />
            </div>
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          {/* Usage Stats */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-3">Usage Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-tertiary)]">Usage Count</span>
                <span className="font-medium">{content.usageCount}x</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-tertiary)]">Last Posted</span>
                <span className="font-medium">{content.lastPostedDate ? formatDate(content.lastPostedDate) : "Never"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-tertiary)]">Last Platform</span>
                <span className="font-medium">{content.lastPostedPlatform || "—"}</span>
              </div>
            </div>
          </div>

          {/* Schedule History */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-3">Schedule History</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {content.schedules.length === 0 ? (
                <p className="text-xs text-[var(--color-text-muted)]">No schedules yet</p>
              ) : (
                content.schedules.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-[var(--color-border-subtle)] last:border-0">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.platform.color }} />
                        <span className="text-xs font-medium">{s.platform.name}</span>
                      </div>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {formatDate(s.scheduledDate)} at {s.scheduledTime}
                      </span>
                    </div>
                    <span className={`badge text-[10px] ${getStatusColor(s.status)}`}>{s.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
