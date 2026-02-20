"use client";

import { useState } from "react";
import { Trophy, Calendar, Target, ChevronUp, Flame, X } from "lucide-react";

interface MobileChallengeTrayProps {
  currentDay: number;
  totalDays: number;
  totalPoints: number;
  dayStreak: number;
  isBeforeStart?: boolean;
  daysUntilPlanStart?: number;
  onOpenChallengeHub: () => void;
}

export function MobileChallengeTray({
  currentDay,
  totalDays,
  totalPoints,
  dayStreak,
  isBeforeStart,
  daysUntilPlanStart,
  onOpenChallengeHub,
}: MobileChallengeTrayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const notStarted = isBeforeStart || currentDay === 0;

  return (
    <div
      className="fixed left-4 right-4 z-40 md:hidden"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
    >
      {/* Collapsed View - Compact Bar */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full bg-card border border-border shadow-lg flex items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-4">
            {/* Day */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-black">
                {notStarted
                  ? daysUntilPlanStart
                    ? `Starts in ${daysUntilPlanStart}d`
                    : "Starting Soon"
                  : `Day ${currentDay}`}
              </span>
            </div>

            {!notStarted && (
              <>
                {/* Divider */}
                <div className="w-px h-4 bg-border" />

                {/* Points */}
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="text-sm font-black">{totalPoints.toLocaleString()} pts</span>
                </div>

                {/* Streak (if > 0) */}
                {dayStreak > 0 && (
                  <>
                    <div className="w-px h-4 bg-border" />
                    <div className="flex items-center gap-1">
                      <Flame className="h-4 w-4 text-primary" />
                      <span className="text-sm font-black">{dayStreak}</span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="bg-card border border-border shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-secondary">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-black tracking-[0.12em] text-muted-foreground uppercase">
                {totalDays}-Day Challenge
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {notStarted ? (
            <div className="p-4 text-center">
              <div className="text-2xl font-black text-amber-500 mb-1">Starting Soon</div>
              <div className="text-xs font-bold text-muted-foreground">
                {daysUntilPlanStart
                  ? `Your challenge begins in ${daysUntilPlanStart} day${daysUntilPlanStart === 1 ? "" : "s"}`
                  : `${totalDays} days total`}
              </div>
            </div>
          ) : (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 p-3">
                {/* Day */}
                <div className="text-center p-2 bg-secondary">
                  <div className="text-2xl font-black gradient-athletic">{currentDay}</div>
                  <div className="text-xs font-bold text-muted-foreground">Day</div>
                </div>

                {/* Points */}
                <div className="text-center p-2 bg-secondary">
                  <div className="text-2xl font-black">{totalPoints.toLocaleString()}</div>
                  <div className="text-xs font-bold text-muted-foreground">Points</div>
                </div>

                {/* Streak */}
                <div className="text-center p-2 bg-secondary">
                  <div className="text-2xl font-black flex items-center justify-center gap-1">
                    {dayStreak}
                    <Flame className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-xs font-bold text-muted-foreground">Streak</div>
                </div>
              </div>

              {/* Remaining Days */}
              <div className="px-3 pb-2">
                <div className="text-xs font-bold text-muted-foreground text-center">
                  {totalDays - currentDay} days remaining
                </div>
              </div>
            </>
          )}

          {/* Action Button */}
          <div className="p-3 pt-0">
            <button
              onClick={() => {
                setIsExpanded(false);
                onOpenChallengeHub();
              }}
              className="btn-athletic w-full flex items-center justify-center gap-2 px-4 py-3 gradient-electric text-black text-sm"
            >
              <Target className="h-4 w-4" />
              Open Challenge Hub
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
