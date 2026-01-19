"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Footprints,
  Droplets,
  Building2,
  Beef,
  Moon,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DailyMetrics,
  DayProgress,
  calculateStepsPoints,
  calculateWaterPoints,
  calculateFloorsPoints,
  calculateProteinPoints,
  calculateSleepPoints,
} from "@/hooks/use-gamification";

interface TodaysTasksProps {
  currentDay: number;
  todayProgress: DayProgress | null;
  onSave: (metrics: DailyMetrics) => boolean;
  canEdit: boolean;
}

const MAX_DAILY_POINTS = 150;
const CHECK_IN_BONUS = 15;

export function TodaysTasks({ currentDay, todayProgress, onSave, canEdit }: TodaysTasksProps) {
  const [metrics, setMetrics] = useState<DailyMetrics>({
    steps: 0,
    waterLiters: 0,
    floorsClimbed: 0,
    proteinGrams: 0,
    sleepHours: 0,
    feeling: "",
    tomorrowFocus: "",
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // Initialize with existing progress if available
  useEffect(() => {
    if (todayProgress?.hasData) {
      setMetrics(todayProgress.metrics);
    }
  }, [todayProgress]);

  // Calculate points in real-time
  const currentPoints = useMemo(() => {
    return {
      steps: calculateStepsPoints(metrics.steps),
      water: calculateWaterPoints(metrics.waterLiters),
      floors: calculateFloorsPoints(metrics.floorsClimbed),
      protein: calculateProteinPoints(metrics.proteinGrams),
      sleep: calculateSleepPoints(metrics.sleepHours),
    };
  }, [metrics]);

  const totalMetricPoints = useMemo(() => {
    return Object.values(currentPoints).reduce((sum, pts) => sum + pts, 0);
  }, [currentPoints]);

  const totalWithBonus = useMemo(() => {
    return Math.min(totalMetricPoints + CHECK_IN_BONUS, MAX_DAILY_POINTS);
  }, [totalMetricPoints]);

  const handleInputChange = (field: keyof DailyMetrics, value: string) => {
    if (field === "feeling" || field === "tomorrowFocus") {
      setMetrics((prev) => ({ ...prev, [field]: value }));
    } else {
      const numValue = parseFloat(value) || 0;
      setMetrics((prev) => ({ ...prev, [field]: numValue }));
    }
    setSaveSuccess(false);
    setSaveError(false);
  };

  const handleSave = () => {
    if (!canEdit) {
      setSaveError(true);
      setTimeout(() => setSaveError(false), 3000);
      return;
    }

    const success = onSave(metrics);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError(true);
      setTimeout(() => setSaveError(false), 3000);
    }
  };

  const inputFields = [
    {
      key: "steps" as const,
      label: "Steps",
      icon: Footprints,
      placeholder: "0",
      type: "number",
      min: 0,
      max: 100000,
      step: 100,
      points: currentPoints.steps,
      hint: "7k=15pts, 10k=30pts, 15k+=45pts",
    },
    {
      key: "waterLiters" as const,
      label: "Water (L)",
      icon: Droplets,
      placeholder: "0.0",
      type: "number",
      min: 0,
      max: 10,
      step: 0.1,
      points: currentPoints.water,
      hint: "3.0L+=15pts",
    },
    {
      key: "floorsClimbed" as const,
      label: "Floors",
      icon: Building2,
      placeholder: "0",
      type: "number",
      min: 0,
      max: 200,
      step: 1,
      points: currentPoints.floors,
      hint: "4=15pts, 14+=45pts",
    },
    {
      key: "proteinGrams" as const,
      label: "Protein (g)",
      icon: Beef,
      placeholder: "0",
      type: "number",
      min: 0,
      max: 500,
      step: 5,
      points: currentPoints.protein,
      hint: "70g+=15pts",
    },
    {
      key: "sleepHours" as const,
      label: "Sleep (hours)",
      icon: Moon,
      placeholder: "0.0",
      type: "number",
      min: 0,
      max: 24,
      step: 0.5,
      points: currentPoints.sleep,
      hint: "7h+=15pts",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Day Indicator */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-1 gradient-electric" />
        <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
          Day {currentDay} - Daily Tasks
        </h3>
      </div>

      {/* Metric Inputs */}
      <div className="space-y-4">
        {inputFields.map((field) => (
          <div key={field.key} className="athletic-card p-4 pl-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-secondary flex-shrink-0">
                <field.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.key} className="font-black uppercase tracking-wide text-sm">
                    {field.label}
                  </Label>
                  <span
                    className={`px-2 py-1 text-xs font-black ${
                      field.points > 0
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {field.points} pts
                  </span>
                </div>
                <Input
                  id={field.key}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={
                    field.key === "waterLiters" || field.key === "sleepHours"
                      ? metrics[field.key] || ""
                      : metrics[field.key] || ""
                  }
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  disabled={!canEdit}
                  className="bg-background border-border"
                />
                <p className="text-xs text-muted-foreground font-bold">{field.hint}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reflection Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-1 gradient-electric" />
          <h4 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
            Daily Reflection
          </h4>
        </div>

        <div className="athletic-card p-4 pl-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feeling" className="font-black uppercase tracking-wide text-sm">
              How are you feeling today?
            </Label>
            <Input
              id="feeling"
              type="text"
              placeholder="Energized, tired, motivated..."
              value={metrics.feeling || ""}
              onChange={(e) => handleInputChange("feeling", e.target.value)}
              disabled={!canEdit}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tomorrowFocus" className="font-black uppercase tracking-wide text-sm">
              What will you focus on tomorrow?
            </Label>
            <Input
              id="tomorrowFocus"
              type="text"
              placeholder="Get 10k steps, drink more water..."
              value={metrics.tomorrowFocus || ""}
              onChange={(e) => handleInputChange("tomorrowFocus", e.target.value)}
              disabled={!canEdit}
              className="bg-background border-border"
            />
          </div>
        </div>
      </div>

      {/* Points Display */}
      <div className="athletic-card p-4 pl-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-black uppercase tracking-wide">Today&apos;s Points</span>
            <p className="text-xs text-muted-foreground font-bold">
              Metrics: {totalMetricPoints} + Check-in bonus: {CHECK_IN_BONUS}
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black gradient-athletic">{totalWithBonus}</span>
            <span className="text-muted-foreground font-bold"> / {MAX_DAILY_POINTS}</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="space-y-3">
        <button
          onClick={handleSave}
          disabled={!canEdit}
          className={`btn-athletic w-full group flex items-center justify-center gap-3 px-8 py-4 ${
            canEdit
              ? "gradient-electric text-black glow-power"
              : "bg-secondary text-muted-foreground cursor-not-allowed"
          }`}
        >
          <Save className="h-5 w-5" />
          Save Today&apos;s Progress
        </button>

        {/* Success/Error Messages */}
        {saveSuccess && (
          <div className="flex items-center gap-2 text-green-500 justify-center">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-bold text-sm">Progress saved successfully!</span>
          </div>
        )}

        {saveError && (
          <div className="flex items-center gap-2 text-red-500 justify-center">
            <AlertCircle className="h-5 w-5" />
            <span className="font-bold text-sm">
              {canEdit
                ? "Error saving progress. Please try again."
                : "Cannot edit previous days after midnight."}
            </span>
          </div>
        )}

        {!canEdit && (
          <p className="text-xs text-muted-foreground font-bold text-center">
            Previous day entries cannot be edited after midnight.
          </p>
        )}
      </div>
    </div>
  );
}
