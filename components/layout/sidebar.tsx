"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Utensils,
  Dumbbell,
  ClipboardList,
  LineChart,
  User,
  LogOut,
} from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/auth";

/**
 * Dashboard sidebar navigation
 * Athletic-styled sidebar matching the landing page design
 */

const navItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Diet Plan",
    icon: Utensils,
    href: "/dashboard/diet",
  },
  {
    label: "Workout Plan",
    icon: Dumbbell,
    href: "/dashboard/workout",
  },
  {
    label: "Check-In",
    icon: ClipboardList,
    href: "/dashboard/checkin",
  },
  {
    label: "Progress",
    icon: LineChart,
    href: "/dashboard/progress",
  },
  {
    label: "Profile",
    icon: User,
    href: "/dashboard/profile",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-card border-r border-border">
      {/* Top accent bar */}
      <div className="h-1 gradient-electric" />

      {/* Logo/Brand */}
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative h-10 w-10 transition-transform duration-200 group-hover:scale-110">
            <Image src="/images/logo.png" alt="Metabolikal" fill className="object-contain" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-foreground">
              METABOLI<span className="gradient-athletic">K</span>AL
            </span>
            <span className="block text-[10px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
              Client Portal
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm font-bold tracking-wider uppercase transition-all relative",
                isActive
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Active indicator */}
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 gradient-electric" />}
              <div className={cn("p-2", isActive ? "bg-primary/20" : "bg-transparent")}>
                <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "")} />
              </div>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold tracking-wider uppercase text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
        >
          <div className="p-2">
            <LogOut className="h-4 w-4" />
          </div>
          Logout
        </button>
      </div>
    </aside>
  );
}
