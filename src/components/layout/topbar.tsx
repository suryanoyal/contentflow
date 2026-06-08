"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  Moon,
  Sun,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationItem } from "@/types";

export function Topbar() {
  const { data: session } = useSession();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {
      // Silently fail
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setShowNotifications(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function markAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Silently fail
    }
  }

  return (
    <>
      <header className="h-14 border-b border-[var(--color-border-subtle)] flex items-center justify-between px-6 glass sticky top-0 z-30">
        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-muted)] text-sm hover:border-[var(--color-border-strong)] transition-all w-64"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-1.5 font-mono text-[10px] text-[var(--color-text-muted)]">
            ⌘K
          </kbd>
        </button>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="relative"
          >
            <AnimatePresence mode="wait">
              {resolvedTheme === "dark" ? (
                <motion.div
                  key="moon"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="w-4 h-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center animate-pulse-glow">
                  {unreadCount}
                </span>
              )}
            </Button>

            {/* Notification Panel */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 top-12 w-80 glass-strong rounded-xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-[var(--color-text-muted)] text-sm">
                        No notifications
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-hover)] transition-colors ${
                            !notification.isRead ? "bg-[var(--color-accent-muted)]" : ""
                          }`}
                        >
                          <p className="text-xs font-medium text-[var(--color-text-primary)]">
                            {notification.title}
                          </p>
                          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
                <span className="text-sm font-medium text-[var(--color-text-secondary)] hidden sm:block">
                  {session?.user?.name || "User"}
                </span>
                <ChevronDown className="w-3 h-3 text-[var(--color-text-muted)]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <User className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-red-400 focus:text-red-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Global Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setSearchOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50"
            >
              <div className="glass-strong rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 border-b border-[var(--color-border-subtle)]">
                  <Search className="w-4 h-4 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search content, platforms, schedules..."
                    className="flex-1 py-3.5 bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none"
                    autoFocus
                  />
                  <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-1.5 font-mono text-[10px] text-[var(--color-text-muted)]">
                    ESC
                  </kbd>
                </div>
                <div className="p-2 max-h-80 overflow-y-auto">
                  {searchQuery ? (
                    <div className="p-4 text-center text-[var(--color-text-muted)] text-sm">
                      <p>Search for &quot;{searchQuery}&quot;</p>
                      <p className="text-xs mt-1">Results will appear as you type</p>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-[var(--color-text-muted)] text-sm">
                      <p>Start typing to search...</p>
                      <div className="flex items-center justify-center gap-4 mt-3 text-xs">
                        <span>Content</span>
                        <span>•</span>
                        <span>Platforms</span>
                        <span>•</span>
                        <span>Schedules</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
