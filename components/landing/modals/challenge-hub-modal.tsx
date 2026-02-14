"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Trophy, ClipboardList, Map, Calendar, ArrowLeft } from "lucide-react";
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

function getTabs(totalDays: number): { id: TabId; label: string; icon: typeof ClipboardList }[] {
  return [
    { id: "tasks", label: "Today's Tasks", icon: ClipboardList },
    { id: "journey", label: "Journey So Far", icon: Map },
    { id: "calendar", label: `${totalDays}-Day Calendar`, icon: Calendar },
  ];
}

export function ChallengeHubModal({ open, onOpenChange, gamification }: ChallengeHubModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("tasks");
  const [editingDay, setEditingDay] = useState<number | null>(null);

  const {
    currentDay,
    totalDays,
    startDate,
    totalPoints,
    weekUnlocked,
    completionPercent,
    dayStreak,
    todayProgress,
    allProgress,
    cumulativeStats,
    saveTodayProgress,
    saveDayProgress,
    canEditDay,
    isDayUnlocked,
    getDayProgress,
  } = gamification;

  const TABS = getTabs(totalDays);

  const handleEditDay = (day: number) => {
    setEditingDay(day);
    setActiveTab("tasks");
  };

  const handleBackToToday = () => {
    setEditingDay(null);
  };

  const handleTabChange = (tab: TabId) => {
    if (tab !== "tasks") {
      setEditingDay(null);
    }
    setActiveTab(tab);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setEditingDay(null);
    }
    onOpenChange(isOpen);
  };

  const handleSaveProgress = async (metrics: DailyMetrics): Promise<boolean> => {
    if (editingDay !== null) {
      return saveDayProgress(editingDay, metrics);
    }
    return saveTodayProgress(metrics);
  };

  const effectiveDay = editingDay ?? currentDay;
  const effectiveProgress = editingDay !== null ? getDayProgress(editingDay) : todayProgress;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-card p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-4 bg-card border-b border-border flex-shrink-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">
            {totalDays}-Day <span className="gradient-athletic">METABOLI-K-AL</span> Challenge Hub
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm mt-2">
            Track your daily progress and earn points towards metabolic mastery
          </DialogDescription>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
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

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4 sm:p-6 pt-4">
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                  btn-athletic flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap flex-shrink-0
                  ${
                    activeTab === tab.id
                      ? "gradient-electric text-black"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  }
                `}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {activeTab === "tasks" && (
                <>
                  {editingDay !== null && (
                    <div className="flex items-center justify-between mb-4 p-3 bg-secondary border border-border">
                      <span className="text-sm font-black uppercase tracking-wider">
                        Editing Day {editingDay}
                      </span>
                      <button
                        onClick={handleBackToToday}
                        className="btn-athletic flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        Back to Today
                      </button>
                    </div>
                  )}
                  <TodaysTasks
                    currentDay={effectiveDay}
                    todayProgress={effectiveProgress}
                    onSave={handleSaveProgress}
                    canEdit={canEditDay(effectiveDay)}
                  />
                </>
              )}

              {activeTab === "journey" && (
                <JourneyTab
                  dayStreak={dayStreak}
                  totalDays={totalDays}
                  totalPoints={totalPoints}
                  cumulativeStats={cumulativeStats}
                />
              )}

              {activeTab === "calendar" && (
                <CalendarTab
                  currentDay={currentDay}
                  totalDays={totalDays}
                  startDate={startDate}
                  weekUnlocked={weekUnlocked}
                  allProgress={allProgress}
                  isDayUnlocked={isDayUnlocked}
                  getDayProgress={getDayProgress}
                  canEditDay={canEditDay}
                  onEditDay={handleEditDay}
                />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
