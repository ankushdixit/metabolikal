/**
 * Template Workout Item Form
 *
 * Form for adding/editing workout items in a template.
 * Adapted from WorkoutItemForm for template items.
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
import {
  TimingSelector,
  type TimingValues,
} from "@/components/admin/timeline-editor/timing-selector";
import type {
  Exercise,
  TemplateWorkoutItem,
  TemplateWorkoutItemInsert,
  WorkoutSection,
} from "@/lib/database.types";
import type { TemplateWorkoutItemWithExercise } from "@/hooks/use-template-data";

// Workout sections
const WORKOUT_SECTIONS: { value: WorkoutSection; label: string }[] = [
  { value: "warmup", label: "Warm-up" },
  { value: "main", label: "Main Workout" },
  { value: "cooldown", label: "Cool-down" },
];

interface TemplateWorkoutItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  templateId: string;
  editItem?: TemplateWorkoutItemWithExercise;
}

/**
 * Form for adding/editing template workout items
 */
export function TemplateWorkoutItemForm({
  isOpen,
  onClose,
  onSuccess,
  templateId,
  editItem,
}: TemplateWorkoutItemFormProps) {
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
  const [notes, setNotes] = useState("");
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
      setNotes(editItem?.notes || "");
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
  const createMutation = useCreate<TemplateWorkoutItem>();
  const updateMutation = useUpdate<TemplateWorkoutItem>();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedExercise && !customExerciseName.trim()) {
      toast.error("Please select an exercise or enter a custom name");
      return;
    }

    // Use a placeholder exercise_id for custom exercises (the first active exercise)
    const exerciseId = selectedExercise?.id || exercises[0]?.id;
    if (!exerciseId) {
      toast.error("No exercises available in the database");
      return;
    }

    const data: TemplateWorkoutItemInsert = {
      template_id: templateId,
      exercise_id: exerciseId,
      exercise_name: useCustom ? customExerciseName.trim() : null,
      section: section,
      sets: typeof sets === "number" ? sets : null,
      reps: typeof reps === "number" ? reps : null,
      duration_minutes: typeof durationMinutes === "number" ? durationMinutes : null,
      scheduled_duration_minutes: scheduledDuration,
      notes: notes || null,
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
          resource: "template_workout_items",
          id: editItem.id,
          values: data,
        });
        toast.success("Exercise updated successfully");
      } else {
        await createMutation.mutation.mutateAsync({
          resource: "template_workout_items",
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
            {isEditing ? "Edit" : "Add"} <span className="text-blue-400">Exercise</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm">
            {isEditing ? "Update the exercise details below." : "Add an exercise to this template."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Exercise Search & Selection */}
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Exercise *
              </Label>

              {selectedExercise ? (
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
              ) : useCustom ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={customExerciseName}
                      onChange={(e) => setCustomExerciseName(e.target.value)}
                      placeholder="Enter custom exercise name..."
                      className="bg-secondary border-border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setUseCustom(false);
                        setCustomExerciseName("");
                      }}
                      className="p-2 hover:bg-secondary rounded border border-border"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
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
                      filteredExercises.map((exercise) => (
                        <button
                          key={exercise.id}
                          type="button"
                          onClick={() => handleSelectExercise(exercise)}
                          className="w-full p-3 text-left hover:bg-secondary/50 border-b border-border last:border-b-0 transition-colors"
                        >
                          <p className="font-bold text-sm">{exercise.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {exercise.category} | {exercise.muscle_group}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleUseCustom}
                    className="w-full p-2 text-sm text-muted-foreground hover:text-foreground border border-dashed border-border rounded hover:border-blue-500/50 transition-colors"
                  >
                    + Use custom exercise name
                  </button>
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

            {/* Sets & Reps */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Sets
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={sets}
                  onChange={(e) => setSets(e.target.value ? Number(e.target.value) : "")}
                  placeholder="3"
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
                  max="100"
                  value={reps}
                  onChange={(e) => setReps(e.target.value ? Number(e.target.value) : "")}
                  placeholder="12"
                  disabled={isSubmitting}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Duration (minutes)
              </Label>
              <Input
                type="number"
                min="1"
                max="180"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value ? Number(e.target.value) : "")}
                placeholder="Optional"
                disabled={isSubmitting}
                className="bg-secondary border-border w-32"
              />
            </div>

            {/* Timing */}
            <TimingSelector
              values={timing}
              onChange={setTiming}
              showAllDay={false}
              disabled={isSubmitting}
            />

            {/* Notes */}
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Notes (optional)
              </Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any instructions or notes..."
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
              disabled={isSubmitting || (!selectedExercise && !customExerciseName.trim())}
              className={cn(
                "btn-athletic flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-black font-bold",
                (isSubmitting || (!selectedExercise && !customExerciseName.trim())) &&
                  "opacity-50 cursor-not-allowed"
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
