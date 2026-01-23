"use client";

import { LucideIcon } from "lucide-react";

export interface StatItem {
  /** The numeric or short value */
  number: string;
  /** Primary label */
  label: string;
  /** Secondary descriptive text */
  sublabel: string;
  /** Icon component */
  icon: LucideIcon;
}

interface HeroStatsCardProps {
  /** Card title */
  title: string;
  /** Array of stat items to display */
  stats: StatItem[];
  /** Optional tagline at bottom */
  tagline?: {
    text: string;
    highlight: string;
  };
  /** Additional CSS classes */
  className?: string;
}

/**
 * Shared stats card component for hero sections.
 * Displays key metrics in an athletic-styled card format.
 */
export function HeroStatsCard({ title, stats, tagline, className = "" }: HeroStatsCardProps) {
  return (
    <div className={`athletic-card p-6 pl-8 sm:p-8 sm:pl-10 ${className}`}>
      <h3 className="text-xs font-black tracking-[0.2em] text-primary mb-8 uppercase">{title}</h3>

      <div className="space-y-8">
        {stats.map((stat, i) => (
          <div key={i} className="flex items-center gap-6">
            <div className="p-3 bg-secondary" aria-hidden="true">
              <stat.icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="number-highlight">{stat.number}</span>
                <span className="text-xl font-black uppercase tracking-tight">{stat.label}</span>
              </div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {stat.sublabel}
              </span>
            </div>
          </div>
        ))}
      </div>

      {tagline && (
        <div className="mt-10 pt-8 border-t border-border">
          <p className="text-xs font-black tracking-[0.25em] text-muted-foreground uppercase">
            {tagline.text} <span className="gradient-athletic">{tagline.highlight}</span>
          </p>
        </div>
      )}
    </div>
  );
}
