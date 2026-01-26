/**
 * Workout Item Form
 *
 * Form for adding/editing workout items on the timeline.
 * Allows selecting exercise from database or entering custom, timing, and sets/reps.
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { useList, useCreate, useUpdate } from "@refinedev/core";
import { Search, Loader2, Dumbbell, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimingSelector, type TimingValues } from "./timing-selector";
import type {
  Exercise,
  WorkoutPlan,
  WorkoutPlanInsert,
  WorkoutSection,
} from "@/lib/database.types";

// Workout sections
const WORKOUT_SECTIONS: { value: WorkoutSection; label: string }[] = [
  { value: "warmup", label: "Warm-up" },
  { value: "main", label: "Main Workout" },
  { value: "cooldown", label: "Cool-down" },
];

interface WorkoutItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId: string;
  dayNumber: number;
  editItem?: WorkoutPlan & { exercises?: Exercise | null };
}

/**
 * Form for adding/editing workout items
 */
export function WorkoutItemForm({
  isOpen,
  onClose,
  onSuccess,
  clientId,
  dayNumber,
  editItem,
}: WorkoutItemFormProps) {
  const isEditing = !!editItem;

  // Form state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [customExerciseName, setCustomExerciseName] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [section, setSection] = useState<WorkoutSection>("main");
  const [sets, setSets] = useState<number | "">("");
  const [reps, setReps] = useState<number | "">("");
  const [durationMinutes, setDurationMinutes] = useState<number | "">("");
  const [scheduledDuration, setScheduledDuration] = useState<number>(30);
  const [instructions, setInstructions] = useState("");
  const [timing, setTiming] = useState<TimingValues>({
    timeType: "period",
    timeStart: null,
    timeEnd: null,
    timePeriod: "afternoon",
    relativeAnchor: null,
    relativeOffsetMinutes: 0,
  });

  // Reset form when modal opens or editItem changes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedExercise(editItem?.exercises || null);
      setCustomExerciseName(
        editItem?.exercise_name && !editItem?.exercises ? editItem.exercise_name : ""
      );
      setUseCustom(!!editItem?.exercise_name && !editItem?.exercises);
      setSection(editItem?.section || "main");
      setSets(editItem?.sets || "");
      setReps(editItem?.reps || "");
      setDurationMinutes(editItem?.duration_minutes || "");
      setScheduledDuration(editItem?.scheduled_duration_minutes || 30);
      setInstructions(editItem?.instructions || "");
      setTiming({
        timeType: editItem?.time_type || "period",
        timeStart: editItem?.time_start || null,
        timeEnd: editItem?.time_end || null,
        timePeriod: editItem?.time_period || "afternoon",
        relativeAnchor: editItem?.relative_anchor || null,
        relativeOffsetMinutes: editItem?.relative_offset_minutes || 0,
      });
    }
  }, [isOpen, editItem]);

  // Fetch exercises
  const exercisesQuery = useList<Exercise>({
    resource: "exercises",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    pagination: { pageSize: 500 },
    sorters: [{ field: "name", order: "asc" }],
  });

  const exercises = exercisesQuery.query.data?.data || [];

  // Filter exercises based on search
  const filteredExercises = useMemo(() => {
    if (!searchQuery) return exercises.slice(0, 20);
    const query = searchQuery.toLowerCase();
    return exercises.filter((item) => item.name.toLowerCase().includes(query)).slice(0, 20);
  }, [exercises, searchQuery]);

  // Mutations
  const createMutation = useCreate<WorkoutPlan>();
  const updateMutation = useUpdate<WorkoutPlan>();

  const isSubmitting = createMutation.mutation.isPending || updateMutation.mutation.isPending;

  // When exercise is selected, populate defaults
  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setUseCustom(false);
    setCustomExerciseName("");
    if (!isEditing) {
      setSets(exercise.default_sets || "");
      setReps(exercise.default_reps || "");
      if (exercise.default_duration_seconds) {
        setDurationMinutes(Math.round(exercise.default_duration_seconds / 60));
      }
    }
    setSearchQuery("");
  };

  const handleUseCustom = () => {
    setUseCustom(true);
    setSelectedExercise(null);
  };

  const exerciseName = useCustom ? customExerciseName : selectedExercise?.name || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!exerciseName) {
      toast.error("Please select or enter an exercise");
      return;
    }

    const data: WorkoutPlanInsert = {
      client_id: clientId,
      day_number: dayNumber,
      exercise_id: selectedExercise?.id || null,
      exercise_name: exerciseName,
      section: section,
      sets: sets || null,
      reps: reps || null,
      duration_minutes: durationMinutes || null,
      scheduled_duration_minutes: scheduledDuration,
      rest_seconds: selectedExercise?.rest_seconds || 60,
      instructions: instructions || null,
      time_type: timing.timeType,
      time_start: timing.timeStart,
      time_end: timing.timeEnd,
      time_period: timing.timePeriod,
      relative_anchor: timing.relativeAnchor,
      relative_offset_minutes: timing.relativeOffsetMinutes,
    };

    try {
      if (isEditing && editItem) {
        await updateMutation.mutation.mutateAsync({
          resource: "workout_plans",
          id: editItem.id,
          values: data,
        });
        toast.success("Exercise updated successfully");
      } else {
        await createMutation.mutation.mutateAsync({
          resource: "workout_plans",
          values: data,
        });
        toast.success("Exercise added successfully");
      }
      onSuccess();
      onClose();
    } catch {
      toast.error(isEditing ? "Failed to update exercise" : "Failed to add exercise");
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg bg-card p-0 max-h-[90vh] flex flex-col">
        {/* Top accent - blue for workouts */}
        <div className="h-1 bg-blue-500" />

        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-blue-400" />
            {isEditing ? "Edit" : "Add"} <span className="text-blue-400">Workout</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm">
            {isEditing
              ? "Update the exercise details below."
              : "Add an exercise to the timeline for this day."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Exercise Selection */}
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Exercise *
              </Label>

              {/* Toggle between library and custom */}
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setUseCustom(false)}
                  className={cn(
                    "flex-1 py-2 text-sm font-bold rounded border transition-colors",
                    !useCustom
                      ? "bg-blue-500/20 border-blue-500 text-blue-400"
                      : "bg-secondary border-border text-muted-foreground hover:border-blue-500/50"
                  )}
                >
                  From Library
                </button>
                <button
                  type="button"
                  onClick={handleUseCustom}
                  className={cn(
                    "flex-1 py-2 text-sm font-bold rounded border transition-colors",
                    useCustom
                      ? "bg-blue-500/20 border-blue-500 text-blue-400"
                      : "bg-secondary border-border text-muted-foreground hover:border-blue-500/50"
                  )}
                >
                  Custom
                </button>
              </div>

              {useCustom ? (
                <Input
                  value={customExerciseName}
                  onChange={(e) => setCustomExerciseName(e.target.value)}
                  placeholder="Enter exercise name..."
                  className="bg-secondary border-border"
                />
              ) : selectedExercise ? (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">{selectedExercise.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedExercise.category} | {selectedExercise.muscle_group}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedExercise(null)}
                    className="p-1 hover:bg-secondary rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search exercises..."
                      className="pl-9 bg-secondary border-border"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-border rounded">
                    {exercisesQuery.query.isLoading ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      </div>
                    ) : filteredExercises.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        No exercises found
                      </div>
                    ) : (
                      filteredExercises.map((ex) => (
                        <button
                          key={ex.id}
                          type="button"
                          onClick={() => handleSelectExercise(ex)}
                          className="w-full p-3 text-left hover:bg-secondary/50 border-b border-border last:border-b-0 transition-colors"
                        >
                          <p className="font-bold text-sm">{ex.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {ex.category} | {ex.muscle_group}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section */}
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Section
              </Label>
              <Select
                value={section}
                onValueChange={(value) => setSection(value as WorkoutSection)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {WORKOUT_SECTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sets, Reps, Duration */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Sets
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={sets}
                  onChange={(e) => setSets(e.target.value ? Number(e.target.value) : "")}
                  placeholder="—"
                  disabled={isSubmitting}
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Reps
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={reps}
                  onChange={(e) => setReps(e.target.value ? Number(e.target.value) : "")}
                  placeholder="—"
                  disabled={isSubmitting}
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Duration (min)
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value ? Number(e.target.value) : "")}
                  placeholder="—"
                  disabled={isSubmitting}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            {/* Scheduled Duration (for timeline display) */}
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Timeline Duration (minutes)
              </Label>
              <Input
                type="number"
                min="5"
                step="5"
                value={scheduledDuration}
                onChange={(e) => setScheduledDuration(Number(e.target.value) || 30)}
                disabled={isSubmitting}
                className="w-24 bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground mt-1">
                How long this appears on the timeline
              </p>
            </div>

            {/* Timing */}
            <TimingSelector
              values={timing}
              onChange={setTiming}
              showAllDay={false}
              disabled={isSubmitting}
            />

            {/* Instructions */}
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Instructions (optional)
              </Label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Any special instructions..."
                disabled={isSubmitting}
                className="w-full p-3 bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none h-20 rounded"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 pt-0 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="btn-athletic flex-1 px-4 py-3 bg-secondary text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !exerciseName}
              className={cn(
                "btn-athletic flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-black font-bold",
                (isSubmitting || !exerciseName) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isEditing ? "Updating..." : "Adding..."}</span>
                </>
              ) : (
                <span>{isEditing ? "Update Exercise" : "Add Exercise"}</span>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
