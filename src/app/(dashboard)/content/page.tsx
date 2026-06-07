"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Film,
  Image as ImageIcon,
  Video,
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStatusColor, getContentTypeLabel, formatDate } from "@/lib/utils";

interface ContentItem {
  id: string;
  contentId: string;
  name: string;
  description: string | null;
  contentType: string;
  status: string;
  usageCount: number;
  lastPostedDate: string | null;
  createdAt: string;
  notes: string | null;
}

const contentTypeIcons: Record<string, React.ReactNode> = {
  REEL: <Film className="w-3.5 h-3.5" />,
  IMAGE: <ImageIcon className="w-3.5 h-3.5" />,
  VIDEO: <Video className="w-3.5 h-3.5" />,
};

export default function ContentPage() {
  const router = useRouter();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(search && { search }),
        ...(typeFilter && { type: typeFilter }),
        ...(statusFilter && { status: statusFilter }),
      });

      const res = await fetch(`/api/content?${params}`);
      if (res.ok) {
        const data = await res.json();
        setContents(data.contents);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, statusFilter]);

  useEffect(() => {
    const debounce = setTimeout(fetchContent, 300);
    return () => clearTimeout(debounce);
  }, [fetchContent]);

  async function deleteContent(id: string) {
    if (!confirm("Are you sure you want to delete this content?")) return;
    try {
      await fetch(`/api/content/${id}`, { method: "DELETE" });
      fetchContent();
    } catch (error) {
      console.error("Error:", error);
    }
  }

  function copyContentId(contentId: string) {
    navigator.clipboard.writeText(contentId);
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
          <h1 className="text-2xl font-bold tracking-tight">Content Library</h1>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
            {total} pieces of content
          </p>
        </div>
        <Link href="/content/new">
          <Button className="gap-1.5">
            <Plus className="w-4 h-4" />
            New Content
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <Input
            placeholder="Search by name, ID, or description..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="REEL">Reel</SelectItem>
            <SelectItem value="IMAGE">Image / Carousel</SelectItem>
            <SelectItem value="VIDEO">Long Video</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="READY">Ready</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="POSTED">Posted</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Content ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Usage</th>
                <th>Last Posted</th>
                <th>Created</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j}><div className="skeleton h-4 w-full rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : contents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <p className="text-[var(--color-text-muted)]">No content found</p>
                    <Link href="/content/new">
                      <Button variant="outline" size="sm" className="mt-3">
                        Create your first content
                      </Button>
                    </Link>
                  </td>
                </tr>
              ) : (
                contents.map((content) => (
                  <tr key={content.id} className="cursor-pointer" onClick={() => router.push(`/content/${content.id}`)}>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-[var(--color-accent)] font-medium">
                          {content.contentId}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); copyContentId(content.contentId); }}
                          className="opacity-0 group-hover:opacity-100 hover:text-[var(--color-text-primary)] transition-opacity"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {content.name}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {contentTypeIcons[content.contentType]}
                        <span className="text-xs">{getContentTypeLabel(content.contentType)}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusColor(content.status)}`}>
                        {content.status}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs">{content.usageCount}x</span>
                    </td>
                    <td>
                      <span className="text-xs">
                        {content.lastPostedDate ? formatDate(content.lastPostedDate) : "—"}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs">{formatDate(content.createdAt)}</span>
                    </td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded-md hover:bg-[var(--color-bg-hover)] transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/content/${content.id}`); }}>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); deleteContent(content.id); }}
                            className="text-red-400"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border-subtle)]">
            <p className="text-xs text-[var(--color-text-muted)]">
              Page {page} of {totalPages} ({total} items)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
