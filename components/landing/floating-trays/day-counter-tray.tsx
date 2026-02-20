"use client";

import { Calendar, Target } from "lucide-react";

interface DayCounterTrayProps {
  currentDay: number;
  totalDays: number;
  isBeforeStart?: boolean;
  daysUntilPlanStart?: number;
  onOpenChallengeHub: () => void;
}

export function DayCounterTray({
  currentDay,
  totalDays,
  isBeforeStart,
  daysUntilPlanStart,
  onOpenChallengeHub,
}: DayCounterTrayProps) {
  const notStarted = isBeforeStart || currentDay === 0;

  return (
    <div className="fixed right-4 bottom-4 z-40 hidden md:block">
      <div className="bg-card border border-border shadow-lg w-48">
        {/* Header */}
        <div className="p-3 border-b border-border flex items-center gap-2">
          <div className="p-1.5 bg-secondary">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xs font-black tracking-[0.12em] text-muted-foreground uppercase">
            {totalDays}-Day Challenge
          </span>
        </div>

        {/* Day Number */}
        <div className="p-4 text-center">
          {notStarted ? (
            <>
              <div className="text-2xl font-black text-amber-500">Starting Soon</div>
              <div className="text-xs font-bold text-muted-foreground mt-1">
                {daysUntilPlanStart
                  ? `Starts in ${daysUntilPlanStart} day${daysUntilPlanStart === 1 ? "" : "s"}`
                  : `${totalDays} days total`}
              </div>
            </>
          ) : (
            <>
              <div className="text-4xl font-black gradient-athletic">Day {currentDay}</div>
              <div className="text-xs font-bold text-muted-foreground mt-1">
                {totalDays - currentDay} days remaining
              </div>
            </>
          )}
        </div>

        {/* Action Button */}
        <div className="p-3 pt-0">
          <button
            onClick={onOpenChallengeHub}
            className="btn-athletic w-full flex items-center justify-center gap-2 px-4 py-2.5 gradient-electric text-black text-sm"
          >
            <Target className="h-4 w-4" />
            Open Challenge Hub
          </button>
        </div>
      </div>
    </div>
  );
}
