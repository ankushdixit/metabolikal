"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Trophy, ClipboardList, Map, Calendar } from "lucide-react";
import { TodaysTasks } from "./challenge-hub/todays-tasks";
import { JourneyTab } from "./challenge-hub/journey-tab";
import { CalendarTab } from "./challenge-hub/calendar-tab";
import { UseGamificationReturn, DailyMetrics } from "@/hooks/use-gamification";

interface ChallengeHubModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gamification: UseGamificationReturn;
}

type TabId = "tasks" | "journey" | "calendar";

const TABS: { id: TabId; label: string; icon: typeof ClipboardList }[] = [
  { id: "tasks", label: "Today's Tasks", icon: ClipboardList },
  { id: "journey", label: "Journey So Far", icon: Map },
  { id: "calendar", label: "30-Day Calendar", icon: Calendar },
];

export function ChallengeHubModal({ open, onOpenChange, gamification }: ChallengeHubModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("tasks");

  const {
    currentDay,
    totalPoints,
    weekUnlocked,
    completionPercent,
    dayStreak,
    todayProgress,
    allProgress,
    cumulativeStats,
    saveTodayProgress,
    canEditDay,
    isDayUnlocked,
    getDayProgress,
  } = gamification;

  const handleSaveProgress = (metrics: DailyMetrics): boolean => {
    return saveTodayProgress(metrics);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card p-0">
        <DialogHeader className="p-6 pb-4 sticky top-0 bg-card z-10 border-b border-border">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">
            30-Day <span className="gradient-athletic">METABOLI-K-AL</span> Challenge Hub
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm mt-2">
            Track your daily progress and earn points towards metabolic mastery
          </DialogDescription>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-secondary">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                  Day
                </div>
                <div className="text-lg font-black">{currentDay}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-secondary">
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                  Points
                </div>
                <div className="text-lg font-black">{totalPoints.toLocaleString()}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-secondary">
                <Map className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                  Week
                </div>
                <div className="text-lg font-black">{weekUnlocked}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-secondary">
                <ClipboardList className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                  Complete
                </div>
                <div className="text-lg font-black">{completionPercent}%</div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 pt-4">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  btn-athletic flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? "gradient-electric text-black"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  }
                `}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === "tasks" && (
              <TodaysTasks
                currentDay={currentDay}
                todayProgress={todayProgress}
                onSave={handleSaveProgress}
                canEdit={canEditDay(currentDay)}
              />
            )}

            {activeTab === "journey" && (
              <JourneyTab
                dayStreak={dayStreak}
                totalPoints={totalPoints}
                cumulativeStats={cumulativeStats}
              />
            )}

            {activeTab === "calendar" && (
              <CalendarTab
                currentDay={currentDay}
                weekUnlocked={weekUnlocked}
                allProgress={allProgress}
                isDayUnlocked={isDayUnlocked}
                getDayProgress={getDayProgress}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
