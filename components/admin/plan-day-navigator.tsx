/**
 * Plan Day Navigator Component
 *
 * A compact day navigation component for the daily plan view.
 * Shows current day with date, navigation arrows, and "Go to day" input.
 */

"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDayDate, isToday } from "@/lib/utils/plan-dates";

interface PlanDayNavigatorProps {
  currentDay: number;
  totalDays: number;
  planStartDate: Date | null;
  onDayChange: (day: number) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Format the day display with day number and optional date
 */
function formatDayDisplay(
  dayNumber: number,
  planStartDate: Date | null
): { dayText: string; dateText: string | null } {
  const dayText = `Day ${dayNumber}`;

  if (!planStartDate) {
    return { dayText, dateText: null };
  }

  const date = getDayDate(planStartDate, dayNumber);
  const dateText = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return { dayText, dateText };
}

/**
 * Plan day navigator component
 */
export function PlanDayNavigator({
  currentDay,
  totalDays,
  planStartDate,
  onDayChange,
  disabled = false,
  className,
}: PlanDayNavigatorProps) {
  const [dayInputValue, setDayInputValue] = useState("");

  const canGoPrevious = currentDay > 1;
  const canGoNext = currentDay < totalDays;
  const isTodayDay = planStartDate ? isToday(planStartDate, currentDay) : false;

  const { dayText, dateText } = formatDayDisplay(currentDay, planStartDate);

  const handlePreviousDay = () => {
    if (canGoPrevious) {
      onDayChange(currentDay - 1);
    }
  };

  const handleNextDay = () => {
    if (canGoNext) {
      onDayChange(currentDay + 1);
    }
  };

  const handleDayInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numeric input
    if (value === "" || /^\d+$/.test(value)) {
      setDayInputValue(value);
    }
  };

  const handleDayInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const day = parseInt(dayInputValue, 10);

    if (day >= 1 && day <= totalDays) {
      onDayChange(day);
      setDayInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleDayInputSubmit(e);
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)}>
      {/* Day Navigation */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          type="button"
          onClick={handlePreviousDay}
          disabled={!canGoPrevious || disabled}
          className={cn(
            "flex-shrink-0 p-2 rounded bg-secondary border border-border transition-all",
            canGoPrevious && !disabled
              ? "text-foreground hover:bg-secondary/80"
              : "text-muted-foreground/30 cursor-not-allowed"
          )}
          aria-label="Previous day"
          title="Previous day"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Current day display */}
        <div className="flex flex-col items-center min-w-[200px]">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black uppercase tracking-tight">{dayText}</span>
            {isTodayDay && (
              <span className="px-2 py-0.5 text-xs font-bold uppercase bg-primary/20 text-primary flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                Today
              </span>
            )}
          </div>
          {dateText && (
            <span className="text-sm text-muted-foreground font-medium">{dateText}</span>
          )}
        </div>

        {/* Next button */}
        <button
          type="button"
          onClick={handleNextDay}
          disabled={!canGoNext || disabled}
          className={cn(
            "flex-shrink-0 p-2 rounded bg-secondary border border-border transition-all",
            canGoNext && !disabled
              ? "text-foreground hover:bg-secondary/80"
              : "text-muted-foreground/30 cursor-not-allowed"
          )}
          aria-label="Next day"
          title="Next day"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Go to day input */}
      <form onSubmit={handleDayInputSubmit} className="flex items-center gap-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Go to day:
        </label>
        <input
          type="text"
          value={dayInputValue}
          onChange={handleDayInputChange}
          onKeyDown={handleKeyDown}
          placeholder={`1-${totalDays}`}
          className="w-20 px-3 py-1.5 text-sm bg-secondary border border-border rounded font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled || !dayInputValue}
          className="px-3 py-1.5 text-sm font-bold bg-primary text-black rounded disabled:opacity-50 transition-opacity"
        >
          Go
        </button>
      </form>

      {/* Day counter */}
      <span className="text-xs text-muted-foreground font-bold ml-auto">
        {currentDay} of {totalDays} days
      </span>
    </div>
  );
}
