"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalorieSummaryProps {
  consumed: number;
  target: number;
}

/**
 * Calorie summary card component
 * Displays consumed vs target calories with visual progress bar
 * Athletic-styled to match landing page design
 */
export function CalorieSummary({ consumed, target }: CalorieSummaryProps) {
  const remaining = Math.max(0, target - consumed);
  const percentage = target > 0 ? Math.min((consumed / target) * 100, 150) : 0;
  const displayPercentage = Math.min(percentage, 100);

  // Determine progress bar color based on percentage
  // Green: on track (< 80%), Yellow: close to limit (80-100%), Red: over (> 100%)
  const getProgressColor = () => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-neon-green";
  };

  const getStatusText = () => {
    if (percentage >= 100) return "Over limit";
    if (percentage >= 80) return "Close to limit";
    return "On track";
  };

  const getStatusColor = () => {
    if (percentage >= 100) return "text-red-500";
    if (percentage >= 80) return "text-yellow-500";
    return "text-neon-green";
  };

  return (
    <div className="athletic-card p-6 pl-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-secondary">
            <Flame className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
              Calories
            </h3>
            <span className={cn("text-xs font-bold uppercase tracking-wider", getStatusColor())}>
              {getStatusText()}
            </span>
          </div>
        </div>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Today
        </span>
      </div>

      {/* Main Numbers */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-black">{consumed.toLocaleString()}</span>
          <span className="text-lg font-bold text-muted-foreground">
            / {target.toLocaleString()} kcal
          </span>
        </div>
        <p className="text-sm font-bold text-muted-foreground">
          {remaining.toLocaleString()} kcal remaining
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-3 bg-secondary overflow-hidden relative">
          <div
            className={cn("h-full transition-all duration-500", getProgressColor())}
            style={{ width: `${displayPercentage}%` }}
          />
          {/* Over 100% indicator */}
          {percentage > 100 && (
            <div
              className="absolute top-0 right-0 h-full bg-red-500/30"
              style={{ width: `${Math.min(percentage - 100, 50)}%` }}
            />
          )}
        </div>
        <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <span>0%</span>
          <span>{Math.round(percentage)}% consumed</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
