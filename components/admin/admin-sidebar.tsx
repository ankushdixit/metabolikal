"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  UtensilsCrossed,
  LogOut,
  Trophy,
  Settings,
  Clock,
  HeartPulse,
} from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/auth";

/**
 * Admin sidebar navigation
 * Athletic-styled sidebar matching the landing page design
 */

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  isSection?: boolean;
  indent?: boolean;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    label: "Clients",
    icon: Users,
    href: "/admin/clients",
  },
  {
    label: "Challengers",
    icon: Trophy,
    href: "/admin/challengers",
  },
  {
    label: "Pending Reviews",
    icon: ClipboardCheck,
    href: "/admin/pending-reviews",
  },
  {
    label: "Food Database",
    icon: UtensilsCrossed,
    href: "/admin/food-database",
  },
  {
    label: "Configuration",
    icon: Settings,
    href: "/admin/config",
    isSection: true,
  },
  {
    label: "Meal Types",
    icon: Clock,
    href: "/admin/config/meal-types",
    indent: true,
  },
  {
    label: "Conditions",
    icon: HeartPulse,
    href: "/admin/config/conditions",
    indent: true,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-card border-r border-border fixed top-0 left-0 h-screen z-40">
      {/* Top accent bar */}
      <div className="h-1 gradient-electric shrink-0" />

      {/* Logo/Brand */}
      <div className="p-6 border-b border-border shrink-0">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="relative h-10 w-10 transition-transform duration-200 group-hover:scale-110">
            <Image src="/images/logo.png" alt="Metabolikal" fill className="object-contain" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-foreground">
              METABOLI<span className="gradient-athletic">K</span>AL
            </span>
            <span className="block text-[10px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
              Admin Portal
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Admin navigation">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && !item.isSection && pathname.startsWith(item.href));

          // Section headers are non-clickable dividers
          if (item.isSection) {
            return (
              <div
                key={item.href}
                className="flex items-center gap-3 px-4 py-3 mt-4 text-xs font-black tracking-[0.15em] uppercase text-muted-foreground border-t border-border pt-4"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm font-bold tracking-wider uppercase transition-all relative",
                item.indent && "pl-8",
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
      <div className="p-4 border-t border-border shrink-0">
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
