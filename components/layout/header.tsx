"use client";

import { useState, useEffect, useMemo } from "react";
import { User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { NotificationsDropdown } from "./notifications-dropdown";

/**
 * Dashboard header component (desktop only)
 * Athletic-styled header with notifications and profile photo
 */
export function Header() {
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    // Get user and profile
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUserId(data.user.id);

        // Fetch profile for avatar
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", data.user.id)
          .single();

        if (profile?.avatar_url) {
          setAvatarUrl(profile.avatar_url);
        }
      }
    });
  }, [supabase]);

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
          {userId && <NotificationsDropdown userId={userId} />}
          <Link
            href="/dashboard/profile"
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all rounded-full"
            aria-label="Profile"
          >
            {avatarUrl ? (
              <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-primary/20">
                <Image src={avatarUrl} alt="Profile" fill className="object-cover" sizes="32px" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
