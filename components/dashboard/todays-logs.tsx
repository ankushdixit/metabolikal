"use client";

import { useState } from "react";
import { Trash2, Clock, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface FoodLog {
  id: string;
  food_name: string | null;
  food_item_id: string | null;
  calories: number;
  protein: number;
  logged_at: string;
  meal_category: string;
  food_items?: {
    name: string;
  } | null;
}

interface TodaysLogsProps {
  logs: FoodLog[];
  onDeleteLog: (logId: string) => void;
  isDeleting?: boolean;
}

/**
 * Format time from ISO string
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * TodaysLogs component
 * Displays all food logs for today with delete functionality
 */
export function TodaysLogs({ logs, onDeleteLog, isDeleting = false }: TodaysLogsProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteConfirm = () => {
    if (deleteConfirmId && !isDeleting) {
      onDeleteLog(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  if (logs.length === 0) {
    return (
      <div className="athletic-card p-6 pl-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-1 gradient-electric" />
          <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
            Today&apos;s Logged Items
          </h3>
        </div>

        <p className="text-sm font-bold text-muted-foreground">
          No food logged yet today. Start logging your meals!
        </p>
      </div>
    );
  }

  // Calculate totals
  const totalCalories = logs.reduce((sum, log) => sum + log.calories, 0);
  const totalProtein = logs.reduce((sum, log) => sum + log.protein, 0);

  return (
    <>
      <div className="athletic-card p-6 pl-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-1 gradient-electric" />
            <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
              Today&apos;s Logged Items
            </h3>
          </div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {logs.length} {logs.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {/* Summary */}
        <div className="flex items-center gap-6 mb-6 p-4 bg-secondary">
          <div>
            <span className="text-2xl font-black gradient-athletic">{totalCalories}</span>
            <span className="text-sm font-bold text-muted-foreground ml-1">kcal total</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div>
            <span className="text-2xl font-black">{totalProtein}</span>
            <span className="text-sm font-bold text-muted-foreground ml-1">g protein total</span>
          </div>
        </div>

        {/* Log Entries */}
        <div className="space-y-3">
          {logs.map((log) => {
            const foodName = log.food_items?.name || log.food_name || "Unknown Food";

            return (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 bg-card border border-border hover:bg-secondary/30 transition-all"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-secondary shrink-0">
                    <Utensils className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-sm truncate">{foodName}</h4>
                    <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                      <span>{log.calories} kcal</span>
                      <span>{log.protein}g protein</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(log.logged_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setDeleteConfirmId(log.id)}
                  className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0"
                  aria-label={`Delete ${foodName}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm bg-card p-0">
          <div className="h-1 bg-red-500" />
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              Delete Log Entry?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-bold text-sm">
              This will remove this food from your daily log. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="p-6 pt-0 gap-3">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="btn-athletic flex-1 px-4 py-3 bg-secondary text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className={cn(
                "btn-athletic flex-1 px-4 py-3 bg-red-500 text-white",
                isDeleting && "opacity-50 cursor-not-allowed"
              )}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
