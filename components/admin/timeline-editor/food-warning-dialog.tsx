/**
 * Food Warning Dialog
 *
 * Displays a warning when a food item has potential incompatibilities
 * with the client's medical conditions. Allows the admin to either
 * cancel the operation or proceed anyway.
 */

"use client";

import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { IncompatibleCondition } from "@/hooks/use-food-compatibility";

interface FoodWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  foodName: string;
  incompatibleConditions: IncompatibleCondition[];
}

/**
 * Warning dialog for food-condition incompatibilities
 */
export function FoodWarningDialog({
  isOpen,
  onClose,
  onConfirm,
  foodName,
  incompatibleConditions,
}: FoodWarningDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card p-0">
        {/* Top accent - amber for warning */}
        <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-600" />

        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Compatibility <span className="text-amber-400">Warning</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm">
            This food item may not be suitable for this client.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 pt-0 space-y-4">
          {/* Food name */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded">
            <p className="font-bold text-foreground">{foodName}</p>
          </div>

          {/* Explanation */}
          <p className="text-sm text-muted-foreground">
            This food item has been flagged as potentially incompatible with the following
            conditions that this client has:
          </p>

          {/* Incompatible conditions list */}
          <ul className="space-y-2">
            {incompatibleConditions.map((condition) => (
              <li
                key={condition.id}
                className="flex items-center gap-2 p-2 bg-secondary/50 rounded border border-border"
              >
                <span className="text-amber-400 font-bold">&bull;</span>
                <span className="font-bold text-sm">{condition.name}</span>
              </li>
            ))}
          </ul>

          {/* Advisory text */}
          <p className="text-sm text-muted-foreground">
            You may still add this item if you have determined it is appropriate for this client.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-athletic flex-1 px-4 py-3 bg-secondary text-foreground font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-athletic flex-1 px-4 py-3 bg-amber-500 text-black font-bold"
          >
            Add Anyway
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
