"use client";

import { useState, memo, useCallback, useMemo } from "react";
import { Check, Lock, Calendar, Pencil } from "lucide-react";
import { DayProgress } from "@/hooks/use-gamification";
import { getDateForDay } from "@/lib/challenge-utils";

interface CalendarTabProps {
  currentDay: number;
  totalDays: number;
  startDate: string;
  weekUnlocked: number;
  allProgress: Record<number, DayProgress>;
  isDayUnlocked: (day: number) => boolean;
  getDayProgress: (day: number) => DayProgress | null;
  canEditDay?: (day: number) => boolean;
  onEditDay?: (day: number) => void;
}

const DAYS_PER_WEEK = 7;

interface CalendarDayButtonProps {
  day: number;
  status: "completed" | "current" | "future" | "locked" | "missed";
  isSelected: boolean;
  dateLabel: string | null;
  onClick: (day: number) => void;
}

const CalendarDayButton = memo(function CalendarDayButton({
  day,
  status,
  isSelected,
  dateLabel,
  onClick,
}: CalendarDayButtonProps) {
  return (
    <button
      onClick={() => onClick(day)}
      disabled={status === "locked"}
      className={`
        aspect-square flex flex-col items-center justify-center relative
        text-sm font-black transition-all
        ${status === "completed" ? "bg-primary text-primary-foreground" : ""}
        ${status === "current" ? "ring-2 ring-primary bg-secondary" : ""}
        ${status === "future" ? "bg-secondary text-muted-foreground hover:bg-secondary/80" : ""}
        ${status === "missed" ? "bg-secondary border-2 border-dashed border-primary/40 text-muted-foreground hover:border-primary/70 cursor-pointer" : ""}
        ${status === "locked" ? "bg-muted text-muted-foreground/50 cursor-not-allowed" : ""}
        ${isSelected ? "ring-2 ring-accent" : ""}
      `}
    >
      {status === "completed" && <Check className="h-4 w-4" />}
      {status === "locked" && <Lock className="h-3 w-3" />}
      {(status === "current" || status === "future" || status === "missed") && day}
      {dateLabel && <span className="text-[8px] leading-tight opacity-70">{dateLabel}</span>}
    </button>
  );
});

export function CalendarTab({
  currentDay,
  totalDays,
  startDate,
  weekUnlocked,
  allProgress,
  isDayUnlocked,
  getDayProgress,
  canEditDay,
  onEditDay,
}: CalendarTabProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const calendarDays = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => i + 1),
    [totalDays]
  );
  const day1Weekday = useMemo(
    () => (startDate ? new Date(startDate + "T00:00:00").getDay() : 0),
    [startDate]
  );

  // Pre-compute date labels for each day to avoid recalculating inside .map()
  const dateLabels = useMemo(() => {
    if (!startDate) return {};
    const labels: Record<number, string> = {};
    for (let i = 1; i <= totalDays; i++) {
      const dayDate = getDateForDay(startDate, i);
      labels[i] = dayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return labels;
  }, [startDate, totalDays]);

  const handleDayClick = useCallback(
    (day: number) => {
      const progress = getDayProgress(day);
      const editable = canEditDay?.(day) ?? false;

      // Only block clicks on locked *future* days
      if (day > currentDay && !isDayUnlocked(day)) {
        setSelectedDay(null);
        return;
      }

      // Missed day (past, no data) — go directly to edit
      if (editable && !progress?.hasData && day < currentDay) {
        onEditDay?.(day);
        return;
      }

      // Completed or current day — toggle details panel
      setSelectedDay((prev) => {
        if (progress?.hasData) {
          return prev === day ? null : day;
        }
        return null;
      });
    },
    [getDayProgress, canEditDay, currentDay, isDayUnlocked, onEditDay]
  );

  const getDayStatus = useCallback(
    (day: number): "completed" | "current" | "future" | "locked" | "missed" => {
      const progress = allProgress[day];

      if (day === currentDay) return "current";
      if (day < currentDay) return progress?.hasData ? "completed" : "missed";
      // Future days: keep week-lock for visual display
      if (!isDayUnlocked(day)) return "locked";
      return "future";
    },
    [allProgress, currentDay, isDayUnlocked]
  );

  const selectedDayProgress = selectedDay ? getDayProgress(selectedDay) : null;

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-1 gradient-electric" />
        <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
          {totalDays}-Day Calendar
        </h3>
      </div>

      {/* Week Unlock Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-2">
        <span className="text-xs font-black tracking-wider text-muted-foreground uppercase">
          Week {weekUnlocked > 4 ? "5 (All)" : weekUnlocked} Unlocked
        </span>
        <span className="text-xs font-bold text-muted-foreground">
          Complete 6/7 days to unlock next week
        </span>
      </div>

      {/* Calendar Grid */}
      <div className="athletic-card p-3 sm:p-4 pl-4 sm:pl-6">
        {/* Week Labels */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
            <div key={i} className="text-center text-xs font-black text-muted-foreground uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Leading padding cells for weekday alignment */}
          {Array.from({ length: day1Weekday }, (_, i) => (
            <div key={`pad-${i}`} className="aspect-square" />
          ))}

          {calendarDays.map((day) => (
            <CalendarDayButton
              key={day}
              day={day}
              status={getDayStatus(day)}
              isSelected={selectedDay === day}
              dateLabel={dateLabels[day] ?? null}
              onClick={handleDayClick}
            />
          ))}

          {/* Fill remaining cells with empty space for visual consistency */}
          {(() => {
            const totalCells = day1Weekday + totalDays;
            const trailing = (DAYS_PER_WEEK - (totalCells % DAYS_PER_WEEK)) % DAYS_PER_WEEK;
            return Array.from({ length: trailing }, (_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ));
          })()}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 sm:gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-primary flex-shrink-0" />
            <span className="text-xs font-bold text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-secondary ring-2 ring-primary flex-shrink-0" />
            <span className="text-xs font-bold text-muted-foreground">Current</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-secondary border-2 border-dashed border-primary/40 flex-shrink-0" />
            <span className="text-xs font-bold text-muted-foreground">Missed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-secondary flex-shrink-0" />
            <span className="text-xs font-bold text-muted-foreground">Upcoming</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-muted flex-shrink-0" />
            <span className="text-xs font-bold text-muted-foreground">Locked</span>
          </div>
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDayProgress && (
        <div className="athletic-card p-4 pl-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-secondary">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-black uppercase tracking-wide">Day {selectedDay} Progress</h4>
              <p className="text-xs text-muted-foreground font-bold">
                Logged on {selectedDayProgress.loggedDate}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
            <div className="bg-secondary p-3">
              <div className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                Steps
              </div>
              <div className="text-lg font-black">
                {selectedDayProgress.metrics.steps.toLocaleString()}
              </div>
            </div>
            <div className="bg-secondary p-3">
              <div className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                Water
              </div>
              <div className="text-lg font-black">{selectedDayProgress.metrics.waterLiters}L</div>
            </div>
            <div className="bg-secondary p-3">
              <div className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                Floors
              </div>
              <div className="text-lg font-black">{selectedDayProgress.metrics.floorsClimbed}</div>
            </div>
            <div className="bg-secondary p-3">
              <div className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                Protein
              </div>
              <div className="text-lg font-black">{selectedDayProgress.metrics.proteinGrams}g</div>
            </div>
            <div className="bg-secondary p-3">
              <div className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                Sleep
              </div>
              <div className="text-lg font-black">{selectedDayProgress.metrics.sleepHours}h</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-sm font-black uppercase tracking-wide">Points Earned</span>
            <div className="flex items-center gap-2">
              {selectedDay && canEditDay?.(selectedDay) && onEditDay && (
                <button
                  onClick={() => onEditDay(selectedDay)}
                  className="btn-athletic flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase tracking-wider bg-secondary hover:bg-secondary/80 text-foreground"
                >
                  <Pencil className="h-3 w-3" />
                  Edit Day {selectedDay}
                </button>
              )}
              <span className="px-4 py-2 gradient-electric text-black font-black">
                {selectedDayProgress.pointsEarned} pts
              </span>
            </div>
          </div>

          {selectedDayProgress.metrics.feeling && (
            <div className="mt-3">
              <span className="text-xs font-black tracking-wider text-muted-foreground uppercase block mb-1">
                Feeling
              </span>
              <p className="text-sm font-bold">{selectedDayProgress.metrics.feeling}</p>
            </div>
          )}

          {selectedDayProgress.metrics.tomorrowFocus && (
            <div className="mt-3">
              <span className="text-xs font-black tracking-wider text-muted-foreground uppercase block mb-1">
                Tomorrow&apos;s Focus
              </span>
              <p className="text-sm font-bold">{selectedDayProgress.metrics.tomorrowFocus}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
