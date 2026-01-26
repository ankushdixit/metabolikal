"use client";

import {
  Footprints,
  Sun,
  BookOpen,
  Droplet,
  Moon,
  Users,
  Heart,
  Zap,
  Dumbbell,
  Leaf,
  Brain,
  Clock,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LIFESTYLE_ACTIVITY_ICONS } from "@/lib/validations";

/**
 * Map of icon string values to Lucide icon components
 */
const ICON_MAP: Record<string, LucideIcon> = {
  footprints: Footprints,
  sun: Sun,
  "book-open": BookOpen,
  droplet: Droplet,
  moon: Moon,
  users: Users,
  heart: Heart,
  zap: Zap,
  dumbbell: Dumbbell,
  leaf: Leaf,
  brain: Brain,
  clock: Clock,
};

interface IconSelectorProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Icon Selector Component
 * Visual icon picker for lifestyle activity types
 */
export function IconSelector({ value, onChange, className }: IconSelectorProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {LIFESTYLE_ACTIVITY_ICONS.map((iconOption) => {
        const IconComponent = ICON_MAP[iconOption.value];
        const isSelected = value === iconOption.value;

        return (
          <button
            key={iconOption.value}
            type="button"
            onClick={() => onChange(iconOption.value)}
            className={cn(
              "p-3 transition-all flex items-center justify-center",
              isSelected
                ? "gradient-electric text-black"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            )}
            aria-label={iconOption.label}
            title={iconOption.label}
          >
            {IconComponent && <IconComponent className="h-5 w-5" />}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Get the Lucide icon component for a given icon string value
 */
export function getIconComponent(iconValue: string | null | undefined): LucideIcon | null {
  if (!iconValue) return null;
  return ICON_MAP[iconValue] || null;
}

/**
 * Render an icon by its string value
 */
export function RenderIcon({
  icon,
  className,
}: {
  icon: string | null | undefined;
  className?: string;
}) {
  const IconComponent = getIconComponent(icon);
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
}
