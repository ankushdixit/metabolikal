"use client";

import { useState } from "react";
import { Trophy, Flame, ClipboardList, Calculator, Eye, ChevronDown } from "lucide-react";

interface PointsTrayProps {
  totalPoints: number;
  healthScore: number;
  dayStreak: number;
  assessmentPoints: number;
  calculatorPoints: number;
  dailyVisitPoints: number;
  completionPercent: number;
}

export function PointsTray({
  totalPoints,
  healthScore,
  dayStreak,
  assessmentPoints,
  calculatorPoints,
  dailyVisitPoints,
  completionPercent,
}: PointsTrayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusMessage = (): string => {
    if (completionPercent >= 100) return "Challenge Complete!";
    if (completionPercent >= 75) return "Almost There!";
    if (completionPercent >= 50) return "Halfway Champion!";
    if (completionPercent >= 25) return "Building Momentum!";
    if (completionPercent > 0) return "Great Start!";
    return "Begin Your Journey";
  };

  const breakdownItems = [
    { icon: Flame, label: "Day Streak", value: dayStreak, unit: "days" },
    { icon: ClipboardList, label: "Assessment", value: assessmentPoints, unit: "pts" },
    { icon: Calculator, label: "Calculator", value: calculatorPoints, unit: "pts" },
    { icon: Eye, label: "Daily Visit", value: dailyVisitPoints, unit: "pts" },
  ];

  return (
    <div className="fixed right-4 top-24 z-40 hidden md:block">
      <div className="bg-card border border-border shadow-lg w-48">
        {/* Header - Always Visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-3 flex items-center justify-between hover:bg-secondary transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-secondary">
              <Trophy className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <div className="text-lg font-black">{totalPoints.toLocaleString()}</div>
              <div className="text-xs font-bold text-muted-foreground">Total Points</div>
            </div>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Expandable Content */}
        <div
          className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}
          `}
        >
          <div className="border-t border-border p-3 space-y-3">
            {/* Health Score */}
            {healthScore > 0 && (
              <div className="bg-secondary p-2">
                <div className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                  Metabolic Health Score
                </div>
                <div className="text-xl font-black gradient-athletic">{healthScore}%</div>
              </div>
            )}

            {/* Status Message */}
            <div className="text-center py-2">
              <span className="text-sm font-black text-primary">{getStatusMessage()}</span>
            </div>

            {/* Breakdown */}
            <div className="space-y-2">
              <div className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                Points Breakdown
              </div>
              {breakdownItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-3 w-3 text-primary" />
                    <span className="text-xs font-bold text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="text-xs font-black">
                    {item.value} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
