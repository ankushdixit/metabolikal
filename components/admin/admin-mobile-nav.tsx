"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  ClipboardCheck,
  UtensilsCrossed,
  LogOut,
} from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/auth";

/**
 * Admin mobile navigation component
 * Athletic-styled mobile sidebar with hamburger toggle
 */

const navItems = [
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
    label: "Pending Reviews",
    icon: ClipboardCheck,
    href: "/admin/pending-reviews",
  },
  {
    label: "Food Database",
    icon: UtensilsCrossed,
    href: "/admin/food-database",
  },
];

export function AdminMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="h-1 gradient-electric" />
        <div className="flex h-16 items-center justify-between px-4">
          {/* Hamburger Button */}
          <button
            onClick={toggleMenu}
            className="p-2 text-foreground bg-secondary"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-2">
            <div className="relative h-8 w-8">
              <Image src="/images/logo.png" alt="Metabolikal" fill className="object-contain" />
            </div>
            <span className="text-lg font-black tracking-tight">
              METABOLI<span className="gradient-athletic">K</span>AL
            </span>
          </Link>

          {/* Spacer for centering */}
          <div className="w-10" />
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={cn(
          "lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-card border-r border-border transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-1 gradient-electric" />

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Link href="/admin" onClick={closeMenu} className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <Image src="/images/logo.png" alt="Metabolikal" fill className="object-contain" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight">
                METABOLI<span className="gradient-athletic">K</span>AL
              </span>
              <span className="block text-[10px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
                Admin Portal
              </span>
            </div>
          </Link>
          <button
            onClick={closeMenu}
            className="p-2 text-foreground bg-secondary"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1" aria-label="Admin mobile navigation">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-bold tracking-wider uppercase transition-all relative",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 gradient-electric" />
                )}
                <div className={cn("p-2", isActive ? "bg-primary/20" : "bg-transparent")}>
                  <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "")} />
                </div>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
          <button
            onClick={() => {
              closeMenu();
              handleLogout();
            }}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold tracking-wider uppercase text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
          >
            <div className="p-2">
              <LogOut className="h-4 w-4" />
            </div>
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
