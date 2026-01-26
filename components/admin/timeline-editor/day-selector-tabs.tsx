/**
 * Day Selector Tabs Component
 *
 * Shows Day 1-N tabs for selecting which day to view/edit in the timeline editor.
 * Supports highlighting days with content, showing the current day, and displaying
 * calendar dates when plan start date is set.
 *
 * For large day counts (>14), shows a compact view with day input and scroll buttons.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { formatDayDate, isToday } from "@/lib/utils/plan-dates";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

interface DaySelectorTabsProps {
  selectedDay: number;
  onSelectDay: (day: number) => void;
  totalDays?: number;
  planStartDate?: Date | null;
  daysWithContent?: number[];
  disabled?: boolean;
  className?: string;
}

/**
 * Day selector tabs for timeline navigation
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [dayInputValue, setDayInputValue] = useState("");

  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  // For many days (>14), use a scrollable container with controls
  const useScrollContainer = totalDays > 14;

  // Check scroll position to show/hide scroll buttons
  const updateScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", updateScrollButtons);
      window.addEventListener("resize", updateScrollButtons);
      return () => {
        container.removeEventListener("scroll", updateScrollButtons);
        window.removeEventListener("resize", updateScrollButtons);
      };
    }
  }, [totalDays]);

  // Scroll to selected day when it changes
  useEffect(() => {
    if (!useScrollContainer) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const selectedButton = container.querySelector(`[data-day="${selectedDay}"]`);
    if (selectedButton) {
      selectedButton.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [selectedDay, useScrollContainer]);

  const scrollBy = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = 300;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

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
    // Only allow numbers
    if (value === "" || /^\d+$/.test(value)) {
      setDayInputValue(value);
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Day navigation controls for large day counts */}
      {useScrollContainer && (
        <div className="flex items-center gap-3 mb-3">
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

      <div className="relative flex items-center gap-2">
        {/* Left scroll button */}
        {useScrollContainer && (
          <button
            type="button"
            onClick={() => scrollBy("left")}
            disabled={!canScrollLeft || disabled}
            className={cn(
              "flex-shrink-0 p-2 rounded bg-secondary border border-border transition-all",
              canScrollLeft
                ? "text-foreground hover:bg-secondary/80"
                : "text-muted-foreground/30 cursor-not-allowed"
            )}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {/* Day buttons container */}
        <div
          ref={scrollContainerRef}
          className={cn(
            "flex gap-2",
            useScrollContainer
              ? "overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent scroll-smooth"
              : "flex-wrap"
          )}
        >
          {days.map((day) => {
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
          })}
        </div>

        {/* Right scroll button */}
        {useScrollContainer && (
          <button
            type="button"
            onClick={() => scrollBy("right")}
            disabled={!canScrollRight || disabled}
            className={cn(
              "flex-shrink-0 p-2 rounded bg-secondary border border-border transition-all",
              canScrollRight
                ? "text-foreground hover:bg-secondary/80"
                : "text-muted-foreground/30 cursor-not-allowed"
            )}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
