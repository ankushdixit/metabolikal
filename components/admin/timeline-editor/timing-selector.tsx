/**
 * Timing Selector Component
 *
 * Shared component for selecting time type and related fields.
 * Used across all timeline item forms.
 */

"use client";

import { cn } from "@/lib/utils";
import { Clock, Calendar, Link2, Sun } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TimeType, TimePeriod, RelativeAnchor } from "@/lib/database.types";

// Time period options
const TIME_PERIODS: { value: TimePeriod; label: string; range: string }[] = [
  { value: "early_morning", label: "Early Morning", range: "5-7 AM" },
  { value: "morning", label: "Morning", range: "7-10 AM" },
  { value: "midday", label: "Midday", range: "10 AM-2 PM" },
  { value: "afternoon", label: "Afternoon", range: "2-5 PM" },
  { value: "evening", label: "Evening", range: "5-8 PM" },
  { value: "night", label: "Night", range: "8-10 PM" },
  { value: "before_sleep", label: "Before Sleep", range: "10-11:59 PM" },
];

// Relative anchor options
const RELATIVE_ANCHORS: { value: RelativeAnchor; label: string }[] = [
  { value: "wake_up", label: "Wake Up" },
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "evening_snack", label: "Evening Snack" },
  { value: "dinner", label: "Dinner" },
  { value: "pre_workout", label: "Pre-Workout" },
  { value: "post_workout", label: "Post-Workout" },
  { value: "sleep", label: "Sleep" },
];

// Common offset options in minutes
const OFFSET_OPTIONS = [
  { value: -60, label: "1 hour before" },
  { value: -30, label: "30 min before" },
  { value: -15, label: "15 min before" },
  { value: 0, label: "At the same time" },
  { value: 15, label: "15 min after" },
  { value: 30, label: "30 min after" },
  { value: 60, label: "1 hour after" },
  { value: 120, label: "2 hours after" },
];

export interface TimingValues {
  timeType: TimeType;
  timeStart: string | null;
  timeEnd: string | null;
  timePeriod: TimePeriod | null;
  relativeAnchor: RelativeAnchor | null;
  relativeOffsetMinutes: number;
}

interface TimingSelectorProps {
  values: TimingValues;
  onChange: (values: TimingValues) => void;
  showAllDay?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Timing selector for timeline items
 */
export function TimingSelector({
  values,
  onChange,
  showAllDay = true,
  disabled = false,
  className,
}: TimingSelectorProps) {
  const timeTypes: { value: TimeType; label: string; icon: typeof Clock; description: string }[] = [
    { value: "fixed", label: "Fixed Time", icon: Clock, description: "Specific time" },
    { value: "period", label: "Time Period", icon: Sun, description: "Time range" },
    { value: "relative", label: "Relative", icon: Link2, description: "Based on anchor" },
    ...(showAllDay
      ? [
          {
            value: "all_day" as TimeType,
            label: "All Day",
            icon: Calendar,
            description: "Full day",
          },
        ]
      : []),
  ];

  const handleTimeTypeChange = (timeType: TimeType) => {
    onChange({
      ...values,
      timeType,
      // Reset fields when changing type
      timeStart: timeType === "fixed" ? "09:00" : null,
      timeEnd: null,
      timePeriod: timeType === "period" ? "morning" : null,
      relativeAnchor: timeType === "relative" ? "breakfast" : null,
      relativeOffsetMinutes: 0,
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Time Type Selection */}
      <div>
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
          Timing Type
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {timeTypes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleTimeTypeChange(value)}
              disabled={disabled}
              className={cn(
                "p-3 rounded border text-left transition-all",
                values.timeType === value
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              <Icon className="h-4 w-4 mb-1" />
              <p className="text-xs font-bold">{label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Fixed Time Fields */}
      {values.timeType === "fixed" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              Start Time *
            </Label>
            <Input
              type="time"
              value={values.timeStart || ""}
              onChange={(e) => onChange({ ...values, timeStart: e.target.value })}
              disabled={disabled}
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              End Time (optional)
            </Label>
            <Input
              type="time"
              value={values.timeEnd || ""}
              onChange={(e) => onChange({ ...values, timeEnd: e.target.value || null })}
              disabled={disabled}
              className="bg-secondary border-border"
            />
          </div>
        </div>
      )}

      {/* Period Fields */}
      {values.timeType === "period" && (
        <div>
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
            Time Period *
          </Label>
          <Select
            value={values.timePeriod || ""}
            onValueChange={(value) => onChange({ ...values, timePeriod: value as TimePeriod })}
            disabled={disabled}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              {TIME_PERIODS.map(({ value, label, range }) => (
                <SelectItem key={value} value={value}>
                  <span>{label}</span>
                  <span className="text-muted-foreground ml-2">({range})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Relative Fields */}
      {values.timeType === "relative" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              Relative To *
            </Label>
            <Select
              value={values.relativeAnchor || ""}
              onValueChange={(value) =>
                onChange({ ...values, relativeAnchor: value as RelativeAnchor })
              }
              disabled={disabled}
            >
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select anchor" />
              </SelectTrigger>
              <SelectContent>
                {RELATIVE_ANCHORS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              Offset
            </Label>
            <Select
              value={String(values.relativeOffsetMinutes)}
              onValueChange={(value) =>
                onChange({ ...values, relativeOffsetMinutes: Number(value) })
              }
              disabled={disabled}
            >
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select offset" />
              </SelectTrigger>
              <SelectContent>
                {OFFSET_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={String(value)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* All Day - No additional fields needed */}
      {values.timeType === "all_day" && (
        <p className="text-sm text-muted-foreground">
          This item will span the entire day on the timeline.
        </p>
      )}
    </div>
  );
}

export { TIME_PERIODS, RELATIVE_ANCHORS, OFFSET_OPTIONS };
