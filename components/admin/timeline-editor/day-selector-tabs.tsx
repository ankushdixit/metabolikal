/**
 * Day Selector Tabs Component
 *
 * Shows 7 days at a time with week-based navigation (like travel booking sites).
 * Supports highlighting days with content, showing the current day, and displaying
 * calendar dates when plan start date is set.
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatDayDate, isToday } from "@/lib/utils/plan-dates";
import { CalendarDays, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface DaySelectorTabsProps {
  selectedDay: number;
  onSelectDay: (day: number) => void;
  totalDays?: number;
  planStartDate?: Date | null;
  daysWithContent?: number[];
  disabled?: boolean;
  className?: string;
}

const DAYS_PER_PAGE = 7;

/**
 * Day selector tabs for timeline navigation with week-based pagination
 */
export function DaySelectorTabs({
  selectedDay,
  onSelectDay,
  totalDays = 7,
  planStartDate = null,
  daysWithContent = [],
  disabled = false,
  className,
}: DaySelectorTabsProps) {
  const [dayInputValue, setDayInputValue] = useState("");

  // Calculate current week/page based on selected day
  const currentWeek = Math.floor((selectedDay - 1) / DAYS_PER_PAGE);
  const totalWeeks = Math.ceil(totalDays / DAYS_PER_PAGE);

  // State to track visible week (can be different from selected day's week)
  const [visibleWeek, setVisibleWeek] = useState(currentWeek);

  // Update visible week when selected day changes (e.g., from "Go to day" input)
  useEffect(() => {
    setVisibleWeek(currentWeek);
  }, [currentWeek]);

  // Calculate visible days for the current week
  const visibleDays = useMemo(() => {
    const startDay = visibleWeek * DAYS_PER_PAGE + 1;
    const endDay = Math.min(startDay + DAYS_PER_PAGE - 1, totalDays);
    const days: number[] = [];
    for (let day = startDay; day <= endDay; day++) {
      days.push(day);
    }
    return days;
  }, [visibleWeek, totalDays]);

  // Week range display text
  const weekRangeText = useMemo(() => {
    const startDay = visibleWeek * DAYS_PER_PAGE + 1;
    const endDay = Math.min(startDay + DAYS_PER_PAGE - 1, totalDays);
    return `Days ${startDay}-${endDay}`;
  }, [visibleWeek, totalDays]);

  // Navigation handlers
  const canGoPrevWeek = visibleWeek > 0;
  const canGoNextWeek = visibleWeek < totalWeeks - 1;

  const goToPrevWeek = () => {
    if (canGoPrevWeek) {
      setVisibleWeek(visibleWeek - 1);
    }
  };

  const goToNextWeek = () => {
    if (canGoNextWeek) {
      setVisibleWeek(visibleWeek + 1);
    }
  };

  const goToFirstWeek = () => {
    setVisibleWeek(0);
  };

  const goToLastWeek = () => {
    setVisibleWeek(totalWeeks - 1);
  };

  // Go to day input handler
  const handleDayInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const day = parseInt(dayInputValue, 10);
    if (day >= 1 && day <= totalDays) {
      onSelectDay(day);
      setDayInputValue("");
    }
  };

  const handleDayInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setDayInputValue(value);
    }
  };

  // For small day counts (<=14), show all days without pagination
  const usePagination = totalDays > 14;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Navigation controls for large day counts */}
      {usePagination && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Day {selectedDay} of {totalDays}
          </span>
          <form onSubmit={handleDayInputSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={dayInputValue}
              onChange={handleDayInputChange}
              placeholder="Go to day..."
              className="w-28 px-2 py-1 text-sm bg-secondary border border-border rounded font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={disabled}
            />
            <button
              type="submit"
              disabled={disabled || !dayInputValue}
              className="px-2 py-1 text-xs font-bold bg-primary text-black rounded disabled:opacity-50"
            >
              Go
            </button>
          </form>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Week navigation buttons */}
        {usePagination && (
          <>
            {/* First week button */}
            <button
              type="button"
              onClick={goToFirstWeek}
              disabled={!canGoPrevWeek || disabled}
              className={cn(
                "flex-shrink-0 p-2 rounded bg-secondary border border-border transition-all",
                canGoPrevWeek
                  ? "text-foreground hover:bg-secondary/80"
                  : "text-muted-foreground/30 cursor-not-allowed"
              )}
              aria-label="First week"
              title="First week"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>

            {/* Previous week button */}
            <button
              type="button"
              onClick={goToPrevWeek}
              disabled={!canGoPrevWeek || disabled}
              className={cn(
                "flex-shrink-0 p-2 rounded bg-secondary border border-border transition-all",
                canGoPrevWeek
                  ? "text-foreground hover:bg-secondary/80"
                  : "text-muted-foreground/30 cursor-not-allowed"
              )}
              aria-label="Previous week"
              title="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Day buttons */}
        <div className="flex flex-wrap gap-2">
          {(usePagination ? visibleDays : Array.from({ length: totalDays }, (_, i) => i + 1)).map(
            (day) => {
              const isSelected = day === selectedDay;
              const hasContent = daysWithContent.includes(day);
              const isTodayDay = planStartDate ? isToday(planStartDate, day) : false;
              const dateLabel = formatDayDate(planStartDate, day);

              return (
                <button
                  key={day}
                  data-day={day}
                  onClick={() => onSelectDay(day)}
                  disabled={disabled}
                  className={cn(
                    "btn-athletic relative px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all flex-shrink-0",
                    isSelected
                      ? "gradient-electric text-black"
                      : hasContent
                        ? "bg-secondary text-foreground hover:bg-secondary/80"
                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground",
                    isTodayDay &&
                      !isSelected &&
                      "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="flex items-center gap-1">
                      Day {day}
                      {isTodayDay && <CalendarDays className="h-3.5 w-3.5" />}
                    </span>
                    {dateLabel && (
                      <span
                        className={cn(
                          "text-[10px] font-medium normal-case tracking-normal",
                          isSelected ? "text-black/70" : "text-muted-foreground"
                        )}
                      >
                        {dateLabel}
                      </span>
                    )}
                  </div>
                  {/* Content indicator dot */}
                  {hasContent && !isSelected && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                  )}
                </button>
              );
            }
          )}
        </div>

        {/* Week navigation buttons */}
        {usePagination && (
          <>
            {/* Next week button */}
            <button
              type="button"
              onClick={goToNextWeek}
              disabled={!canGoNextWeek || disabled}
              className={cn(
                "flex-shrink-0 p-2 rounded bg-secondary border border-border transition-all",
                canGoNextWeek
                  ? "text-foreground hover:bg-secondary/80"
                  : "text-muted-foreground/30 cursor-not-allowed"
              )}
              aria-label="Next week"
              title="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Last week button */}
            <button
              type="button"
              onClick={goToLastWeek}
              disabled={!canGoNextWeek || disabled}
              className={cn(
                "flex-shrink-0 p-2 rounded bg-secondary border border-border transition-all",
                canGoNextWeek
                  ? "text-foreground hover:bg-secondary/80"
                  : "text-muted-foreground/30 cursor-not-allowed"
              )}
              aria-label="Last week"
              title="Last week"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Week indicator */}
      {usePagination && (
        <div className="text-xs text-muted-foreground font-bold">
          {weekRangeText} • Week {visibleWeek + 1} of {totalWeeks}
        </div>
      )}
    </div>
  );
}
