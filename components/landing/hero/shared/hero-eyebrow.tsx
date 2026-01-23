"use client";

import { LucideIcon, Flame } from "lucide-react";

interface HeroEyebrowProps {
  /** Text to display */
  text: string;
  /** Optional icon (defaults to Flame) */
  icon?: LucideIcon;
  /** Animation class for entry effect */
  animationClass?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Shared eyebrow/badge component for hero sections.
 * Small tag element displayed above the main headline.
 */
export function HeroEyebrow({
  text,
  icon: Icon = Flame,
  animationClass = "animate-slide-power",
  className = "",
}: HeroEyebrowProps) {
  return (
    <div
      className={`${animationClass} inline-flex items-center gap-2 px-4 py-2 bg-secondary mb-8 ${className}`}
    >
      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
      <span className="text-xs font-black tracking-[0.2em] text-muted-foreground uppercase">
        {text}
      </span>
    </div>
  );
}
