/**
 * Add Item Modal
 *
 * Type selector modal for adding items to the timeline.
 * Opens the appropriate form based on selected type.
 */

"use client";

import { useState } from "react";
import { Utensils, Pill, Dumbbell, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { TimelineItemType } from "@/lib/database.types";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: TimelineItemType) => void;
}

const ITEM_TYPES: {
  type: TimelineItemType;
  label: string;
  description: string;
  icon: typeof Utensils;
  colorClasses: string;
}[] = [
  {
    type: "meal",
    label: "Meal",
    description: "Add a food item with timing",
    icon: Utensils,
    colorClasses: "bg-orange-500/20 border-orange-500/50 text-orange-400 hover:bg-orange-500/30",
  },
  {
    type: "supplement",
    label: "Supplement",
    description: "Add a supplement with dosage",
    icon: Pill,
    colorClasses: "bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30",
  },
  {
    type: "workout",
    label: "Workout",
    description: "Add an exercise or workout",
    icon: Dumbbell,
    colorClasses: "bg-blue-500/20 border-blue-500/50 text-blue-400 hover:bg-blue-500/30",
  },
  {
    type: "lifestyle",
    label: "Lifestyle",
    description: "Add a lifestyle activity",
    icon: Activity,
    colorClasses: "bg-purple-500/20 border-purple-500/50 text-purple-400 hover:bg-purple-500/30",
  },
];

/**
 * Modal for selecting which type of item to add
 */
export function AddItemModal({ isOpen, onClose, onSelectType }: AddItemModalProps) {
  const [hoveredType, setHoveredType] = useState<TimelineItemType | null>(null);

  const handleSelect = (type: TimelineItemType) => {
    // Note: Don't call onClose here - the parent will handle the modal transition
    // by setting the new modal type which will close this one
    onSelectType(type);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card p-0">
        {/* Top accent */}
        <div className="h-1 gradient-electric" />

        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-black uppercase tracking-tight">
            Add <span className="gradient-athletic">Item</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm">
            Select the type of item you want to add to the timeline.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 pt-0 grid grid-cols-2 gap-3">
          {ITEM_TYPES.map(({ type, label, description, icon: Icon, colorClasses }) => (
            <button
              key={type}
              onClick={() => handleSelect(type)}
              onMouseEnter={() => setHoveredType(type)}
              onMouseLeave={() => setHoveredType(null)}
              className={cn(
                "p-4 rounded border transition-all text-left",
                colorClasses,
                hoveredType === type && "scale-[1.02]"
              )}
            >
              <Icon className="h-6 w-6 mb-2" />
              <p className="font-bold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </button>
          ))}
        </div>

        <div className="p-4 pt-0">
          <button
            onClick={onClose}
            className="w-full btn-athletic px-4 py-2 bg-secondary text-foreground text-sm font-bold"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
