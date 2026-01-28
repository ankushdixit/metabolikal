"use client";

import { X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectionActionBarProps {
  selectedCount: number;
  onCancel: () => void;
  onSendNotification: () => void;
}

/**
 * Floating action bar that appears during selection mode
 * Shows selected count and action buttons
 */
export function SelectionActionBar({
  selectedCount,
  onCancel,
  onSendNotification,
}: SelectionActionBarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="athletic-card bg-card/95 backdrop-blur-sm border border-border shadow-2xl p-4 flex items-center gap-4">
        {/* Selected count */}
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/20">
          <span className="font-bold text-primary" data-testid="selected-count">
            {selectedCount} selected
          </span>
        </div>

        {/* Cancel button */}
        <button
          onClick={onCancel}
          className="btn-athletic inline-flex items-center gap-2 px-4 py-2 bg-secondary text-foreground text-sm font-bold uppercase tracking-wider"
          data-testid="cancel-button"
        >
          <X className="h-4 w-4" />
          <span>Cancel</span>
        </button>

        {/* Send Notification button */}
        <button
          onClick={onSendNotification}
          disabled={selectedCount === 0}
          className={cn(
            "btn-athletic inline-flex items-center gap-2 px-4 py-2 gradient-electric text-black text-sm font-bold uppercase tracking-wider glow-power",
            selectedCount === 0 && "opacity-50 cursor-not-allowed"
          )}
          data-testid="send-notification-button"
        >
          <Send className="h-4 w-4" />
          <span>Send Notification</span>
        </button>
      </div>
    </div>
  );
}
