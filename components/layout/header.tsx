"use client";

import { Bell, User } from "lucide-react";
import Link from "next/link";

/**
 * Dashboard header component (desktop only)
 * Athletic-styled header with notifications
 */
export function Header() {
  return (
    <header className="hidden lg:block sticky top-0 z-40 bg-card border-b border-border">
      <div className="flex h-14 items-center justify-between px-6">
        {/* Page breadcrumb area - can be used for dynamic page titles */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-1 gradient-electric" />
          <span className="text-xs font-black tracking-[0.15em] text-primary uppercase">
            Dashboard
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
          <Link
            href="/dashboard/profile"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            aria-label="Profile"
          >
            <User className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
