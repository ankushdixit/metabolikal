"use client";

/*
 * Landing Page Header Component
 * Sports-inspired navigation with mobile menu support
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, Flame, ChevronRight } from "lucide-react";
import { useModalContext } from "@/contexts/modal-context";

const navItems = ["Home", "Transformations", "About", "Challenge"];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { openModal } = useModalContext();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleBookCall = () => {
    closeMobileMenu();
    openModal("calendly");
  };

  const handleTakeAssessment = () => {
    closeMobileMenu();
    openModal("assessment");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md">
      {/* Top accent bar */}
      <div className="h-1 gradient-electric" />

      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-4 group">
            <div className="relative h-12 w-12 transition-transform duration-200 group-hover:scale-110">
              <Image src="/images/logo.png" alt="Metabolikal" fill className="object-contain" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-foreground">
                METABOLI<span className="gradient-athletic">K</span>AL
              </span>
              <span className="block text-[10px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
                Elite Performance
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item}
                href={item === "Home" ? "#" : `#${item.toLowerCase()}`}
                className="px-4 py-2 text-sm font-bold tracking-wider text-muted-foreground uppercase hover:text-foreground hover:bg-secondary transition-all"
              >
                {item}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={handleTakeAssessment}
              className="btn-athletic px-5 py-3 text-sm text-foreground bg-secondary"
            >
              Take Assessment
            </button>
            <button
              onClick={handleBookCall}
              className="btn-athletic px-5 py-3 text-sm text-primary-foreground gradient-electric glow-power animate-pulse-power flex items-center gap-2"
            >
              <Flame className="h-4 w-4" />
              Book a Call
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 text-foreground bg-secondary"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Bottom border */}
      <div className="h-px bg-border" />

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <nav className="mx-auto max-w-7xl px-6 py-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item}>
                  <Link
                    href={item === "Home" ? "#" : `#${item.toLowerCase()}`}
                    onClick={closeMobileMenu}
                    className="block px-4 py-3 text-sm font-bold tracking-wider text-muted-foreground uppercase hover:text-foreground hover:bg-secondary transition-all"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Mobile CTA Buttons */}
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              <button
                onClick={handleTakeAssessment}
                className="btn-athletic w-full px-5 py-3 text-sm text-foreground bg-secondary"
              >
                Take Assessment
              </button>
              <button
                onClick={handleBookCall}
                className="btn-athletic w-full px-5 py-3 text-sm text-primary-foreground gradient-electric glow-power flex items-center justify-center gap-2"
              >
                <Flame className="h-4 w-4" />
                Book a Call
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
