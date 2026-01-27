/**
 * Timeline Date Navigation Component
 *
 * Provides date navigation for the client timeline with:
 * - Calendar date picker
 * - Previous/next day navigation
 * - "Today" button to return to current day
 * - Prevents navigation to future dates
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDayNumber } from "@/lib/utils/plan-dates";

interface TimelineDateNavProps {
  /** The currently selected date */
  selectedDate: Date;
  /** The plan start date (Day 1) */
  planStartDate: Date;
  /** Total days in the plan */
  totalDays: number;
  /** Callback when date changes */
  onDateChange: (date: Date) => void;
  /** Whether navigation is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Simple inline calendar for date selection
 */
function InlineCalendar({
  selectedDate,
  planStartDate,
  onSelect,
  onClose,
}: {
  selectedDate: Date;
  planStartDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}) {
  const [viewDate, setViewDate] = useState(selectedDate);
  const calendarRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Close calendar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Get calendar data for the current month view
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDay = firstDayOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = lastDayOfMonth.getDate();

  // Generate calendar grid
  const calendarDays: (Date | null)[] = [];

  // Empty cells before first day
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  const monthName = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (date: Date) => {
    // Don't allow future dates
    if (date > today) return;
    // Don't allow dates before plan start
    if (date < planStartDate) return;

    onSelect(date);
    onClose();
  };

  return (
    <div
      ref={calendarRef}
      className="absolute top-full left-0 mt-2 p-3 bg-card border border-border rounded-lg shadow-xl z-[100] min-w-[280px]"
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1 hover:bg-secondary rounded transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-bold text-sm">{monthName}</span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 hover:bg-secondary rounded transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="text-center text-xs font-bold text-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="h-8" />;
          }

          const isSelected = date.toDateString() === selectedDate.toDateString();
          const isCurrentDay = date.toDateString() === today.toDateString();
          const isFuture = date > today;
          const isBeforePlan = date < planStartDate;
          const isDisabled = isFuture || isBeforePlan;

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => handleDayClick(date)}
              disabled={isDisabled}
              className={cn(
                "h-8 w-8 text-sm font-medium rounded transition-colors",
                isSelected && "bg-primary text-black font-bold",
                !isSelected && isCurrentDay && "bg-primary/20 text-primary font-bold",
                !isSelected && !isCurrentDay && !isDisabled && "hover:bg-secondary",
                isDisabled && "text-muted-foreground/30 cursor-not-allowed"
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="mt-3 pt-3 border-t border-border flex gap-2">
        <button
          type="button"
          onClick={() => {
            onSelect(today);
            onClose();
          }}
          className="flex-1 px-2 py-1.5 text-xs font-bold bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => {
            onSelect(planStartDate);
            onClose();
          }}
          className="flex-1 px-2 py-1.5 text-xs font-bold bg-secondary text-foreground rounded hover:bg-secondary/80 transition-colors"
        >
          Day 1
        </button>
      </div>
    </div>
  );
}

/**
 * Timeline date navigation component
 */
export function TimelineDateNav({
  selectedDate,
  planStartDate,
  totalDays,
  onDateChange,
  disabled = false,
  className,
}: TimelineDateNavProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDateNormalized = new Date(selectedDate);
  selectedDateNormalized.setHours(0, 0, 0, 0);

  // Calculate day number for selected date
  const dayNumber = getDayNumber(planStartDate, selectedDate);
  const isViewingToday = selectedDateNormalized.toDateString() === today.toDateString();

  // Navigation constraints
  const canGoPrevious = selectedDateNormalized > planStartDate;
  const canGoNext = selectedDateNormalized < today;

  // Format date display
  const dateDisplay = selectedDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handlePreviousDay = () => {
    if (!canGoPrevious || disabled) return;
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    onDateChange(prevDate);
  };

  const handleNextDay = () => {
    if (!canGoNext || disabled) return;
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    onDateChange(nextDate);
  };

  const handleGoToToday = () => {
    if (disabled) return;
    onDateChange(today);
  };

  // Determine if this is a past day (for styling purposes)
  const isPast = selectedDateNormalized < today;

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {/* Previous day button */}
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

      {/* Date picker button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowCalendar(!showCalendar)}
          disabled={disabled}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded bg-secondary border border-border transition-all",
            !disabled && "hover:bg-secondary/80",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Calendar className="h-4 w-4 text-primary" />
          <div className="flex flex-col items-start">
            <span className="font-bold text-sm">{dateDisplay}</span>
            <span className="text-xs text-muted-foreground">
              {dayNumber < 1
                ? "Before plan"
                : `Day ${dayNumber > totalDays ? ((dayNumber - 1) % totalDays) + 1 : dayNumber}`}
              {isPast && !isViewingToday && dayNumber >= 1 && " (History)"}
            </span>
          </div>
        </button>

        {/* Calendar dropdown */}
        {showCalendar && (
          <InlineCalendar
            selectedDate={selectedDate}
            planStartDate={planStartDate}
            onSelect={onDateChange}
            onClose={() => setShowCalendar(false)}
          />
        )}
      </div>

      {/* Next day button */}
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

      {/* Today button (shown when not viewing today) */}
      {!isViewingToday && (
        <button
          type="button"
          onClick={handleGoToToday}
          disabled={disabled}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded bg-primary/20 border border-primary/50 text-primary font-bold text-sm transition-all",
            !disabled && "hover:bg-primary/30",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <CalendarDays className="h-4 w-4" />
          Today
        </button>
      )}
    </div>
  );
}
