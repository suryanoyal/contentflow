"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Film, Image as ImageIcon, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

const contentTypes = [
  { value: "REEL", label: "Reel", code: "R", icon: Film, color: "from-pink-500 to-rose-500" },
  { value: "IMAGE", label: "Image / Carousel", code: "I", icon: ImageIcon, color: "from-blue-500 to-cyan-500" },
  { value: "VIDEO", label: "Long Video", code: "V", icon: Video, color: "from-violet-500 to-purple-500" },
];

export default function NewContentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contentType) {
      setError("Please select a content type");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, contentType, status, notes }),
      });

      if (res.ok) {
        router.push("/content");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create content");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/content">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Content</h1>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5">
            Add new content to your library
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Content Type Selection */}
        <div className="space-y-3">
          <Label>Content Type</Label>
          <div className="grid grid-cols-3 gap-3">
            {contentTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = contentType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setContentType(type.value)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                    isSelected
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-muted)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-border-strong)] bg-[var(--color-bg-tertiary)]"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center mx-auto mb-2`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm font-medium">{type.label}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Code: {type.code}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Content Name</Label>
          <Input
            id="name"
            placeholder="e.g. Summer Collection Reel"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Brief description of the content..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label>Initial Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="READY">Ready</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Any additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
          >
            {error}
          </motion.p>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border-subtle)]">
          <Link href="/content">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Content"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
