"use client";

import { useState } from "react";
import { Check, Lock, Calendar } from "lucide-react";
import { DayProgress } from "@/hooks/use-gamification";

interface CalendarTabProps {
  currentDay: number;
  weekUnlocked: number;
  allProgress: Record<number, DayProgress>;
  isDayUnlocked: (day: number) => boolean;
  getDayProgress: (day: number) => DayProgress | null;
}

const TOTAL_DAYS = 30;
const DAYS_PER_WEEK = 7;

export function CalendarTab({
  currentDay,
  weekUnlocked,
  allProgress,
  isDayUnlocked,
  getDayProgress,
}: CalendarTabProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Generate calendar grid (5 rows x 7 columns = 35 cells, but only 30 days)
  const calendarDays = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1);

  const handleDayClick = (day: number) => {
    const unlocked = isDayUnlocked(day);
    const progress = getDayProgress(day);

    if (unlocked && progress?.hasData) {
      setSelectedDay(selectedDay === day ? null : day);
    } else if (!unlocked) {
      // Show tooltip or do nothing for locked days
      setSelectedDay(null);
    } else {
      setSelectedDay(null);
    }
  };

  const getDayStatus = (day: number): "completed" | "current" | "future" | "locked" => {
    const unlocked = isDayUnlocked(day);
    const progress = allProgress[day];

    if (!unlocked) return "locked";
    if (day === currentDay) return "current";
    if (progress?.hasData) return "completed";
    return "future";
  };

  const selectedDayProgress = selectedDay ? getDayProgress(selectedDay) : null;

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-1 gradient-electric" />
        <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
          30-Day Calendar
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
          {calendarDays.map((day) => {
            const status = getDayStatus(day);
            const isSelected = selectedDay === day;

            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                disabled={status === "locked"}
                className={`
                  aspect-square flex items-center justify-center relative
                  text-sm font-black transition-all
                  ${status === "completed" ? "bg-primary text-primary-foreground" : ""}
                  ${status === "current" ? "ring-2 ring-primary bg-secondary" : ""}
                  ${status === "future" ? "bg-secondary text-muted-foreground hover:bg-secondary/80" : ""}
                  ${status === "locked" ? "bg-muted text-muted-foreground/50 cursor-not-allowed" : ""}
                  ${isSelected ? "ring-2 ring-accent" : ""}
                `}
              >
                {status === "completed" && <Check className="h-4 w-4" />}
                {status === "locked" && <Lock className="h-3 w-3" />}
                {(status === "current" || status === "future") && day}
              </button>
            );
          })}

          {/* Fill remaining cells (31-35) with empty space for visual consistency */}
          {Array.from(
            { length: (DAYS_PER_WEEK - (TOTAL_DAYS % DAYS_PER_WEEK)) % DAYS_PER_WEEK },
            (_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            )
          )}
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
            <span className="px-4 py-2 gradient-electric text-black font-black">
              {selectedDayProgress.pointsEarned} pts
            </span>
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
