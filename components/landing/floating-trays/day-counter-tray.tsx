"use client";

import { Calendar, ClipboardList, Target } from "lucide-react";

interface DayCounterTrayProps {
  currentDay: number;
  onOpenTodaysTasks: () => void;
  onOpenChallengeHub: () => void;
}

export function DayCounterTray({
  currentDay,
  onOpenTodaysTasks,
  onOpenChallengeHub,
}: DayCounterTrayProps) {
  return (
    <div className="fixed right-4 bottom-4 z-40 hidden md:block">
      <div className="bg-card border border-border shadow-lg w-48">
        {/* Header */}
        <div className="p-3 border-b border-border flex items-center gap-2">
          <div className="p-1.5 bg-secondary">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xs font-black tracking-[0.12em] text-muted-foreground uppercase">
            30-Day Challenge
          </span>
        </div>

        {/* Day Number */}
        <div className="p-4 text-center">
          <div className="text-4xl font-black gradient-athletic">Day {currentDay}</div>
          <div className="text-xs font-bold text-muted-foreground mt-1">
            {30 - currentDay} days remaining
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 pt-0 space-y-2">
          <button
            onClick={onOpenTodaysTasks}
            className="btn-athletic w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-foreground hover:bg-secondary/80 text-sm"
          >
            <ClipboardList className="h-4 w-4 text-primary" />
            View Today&apos;s Tasks
          </button>

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
