/**
 * Apply Template Modal
 *
 * Modal for selecting and applying a template to a client's plan day.
 * Supports two modes:
 * - Add: Adds template items to existing items on the day
 * - Replace: Clears existing items and replaces with template items
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { useList, useCreate } from "@refinedev/core";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { Search, Loader2, LayoutTemplate, Filter, Plus, RefreshCw, Check } from "lucide-react";
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
import { TEMPLATE_CATEGORIES } from "@/lib/validations";
import type { PlanTemplate } from "@/lib/database.types";
import type {
  TemplateDietItemWithFood,
  TemplateSupplementItemWithSupplement,
  TemplateWorkoutItemWithExercise,
  TemplateLifestyleItemWithType,
} from "@/hooks/use-template-data";

/**
 * Extended template type with item counts
 */
interface TemplateWithCounts extends PlanTemplate {
  template_diet_items: { count: number }[];
  template_supplement_items: { count: number }[];
  template_workout_items: { count: number }[];
  template_lifestyle_items: { count: number }[];
}

type ApplyMode = "add" | "replace";

interface ApplyTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId: string;
  dayNumber: number;
  /** Existing items on the target day (for replace mode) */
  existingDietPlanIds?: string[];
  existingSupplementPlanIds?: string[];
  existingWorkoutPlanIds?: string[];
  existingLifestylePlanIds?: string[];
}

export function ApplyTemplateModal({
  isOpen,
  onClose,
  onSuccess,
  clientId,
  dayNumber,
  existingDietPlanIds = [],
  existingSupplementPlanIds = [],
  existingWorkoutPlanIds = [],
  existingLifestylePlanIds = [],
}: ApplyTemplateModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [applyMode, setApplyMode] = useState<ApplyMode>("add");
  const [isApplying, setIsApplying] = useState(false);

  // Fetch active templates with item counts
  const templatesQuery = useList<TemplateWithCounts>({
    resource: "plan_templates",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    sorters: [{ field: "name", order: "asc" }],
    pagination: { mode: "off" },
    meta: {
      select:
        "*, template_diet_items(count), template_supplement_items(count), template_workout_items(count), template_lifestyle_items(count)",
    },
    queryOptions: {
      enabled: isOpen,
    },
  });

  const templates = templatesQuery.query.data?.data || [];

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let result = templates;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) => t.name.toLowerCase().includes(query) || t.description?.toLowerCase().includes(query)
      );
    }

    if (categoryFilter) {
      result = result.filter((t) => t.category === categoryFilter);
    }

    return result;
  }, [templates, searchQuery, categoryFilter]);

  // Fetch selected template items
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const dietItemsQuery = useList<TemplateDietItemWithFood>({
    resource: "template_diet_items",
    filters: [{ field: "template_id", operator: "eq", value: selectedTemplateId }],
    meta: { select: "*, food_items(*)" },
    queryOptions: {
      enabled: !!selectedTemplateId,
    },
  });

  const supplementItemsQuery = useList<TemplateSupplementItemWithSupplement>({
    resource: "template_supplement_items",
    filters: [{ field: "template_id", operator: "eq", value: selectedTemplateId }],
    meta: { select: "*, supplements(*)" },
    queryOptions: {
      enabled: !!selectedTemplateId,
    },
  });

  const workoutItemsQuery = useList<TemplateWorkoutItemWithExercise>({
    resource: "template_workout_items",
    filters: [{ field: "template_id", operator: "eq", value: selectedTemplateId }],
    sorters: [{ field: "display_order", order: "asc" }],
    meta: { select: "*, exercises(*)" },
    queryOptions: {
      enabled: !!selectedTemplateId,
    },
  });

  const lifestyleItemsQuery = useList<TemplateLifestyleItemWithType>({
    resource: "template_lifestyle_items",
    filters: [{ field: "template_id", operator: "eq", value: selectedTemplateId }],
    sorters: [{ field: "display_order", order: "asc" }],
    meta: { select: "*, lifestyle_activity_types(*)" },
    queryOptions: {
      enabled: !!selectedTemplateId,
    },
  });

  // Create mutations - destructure mutateAsync directly like copy-day-modal
  const { mutateAsync: createDietPlan } = useCreate();
  const { mutateAsync: createSupplementPlan } = useCreate();
  const { mutateAsync: createWorkoutPlan } = useCreate();
  const { mutateAsync: createLifestylePlan } = useCreate();

  const getItemCount = (template: TemplateWithCounts) => {
    return (
      (template.template_diet_items?.[0]?.count || 0) +
      (template.template_supplement_items?.[0]?.count || 0) +
      (template.template_workout_items?.[0]?.count || 0) +
      (template.template_lifestyle_items?.[0]?.count || 0)
    );
  };

  const handleApply = useCallback(async () => {
    if (!selectedTemplateId) return;

    setIsApplying(true);

    try {
      // In replace mode, delete existing items first using Supabase directly
      if (applyMode === "replace") {
        const supabase = createBrowserSupabaseClient();

        if (existingDietPlanIds.length > 0) {
          const { error } = await supabase
            .from("diet_plans")
            .delete()
            .in("id", existingDietPlanIds);
          if (error) throw error;
        }

        if (existingSupplementPlanIds.length > 0) {
          const { error } = await supabase
            .from("supplement_plans")
            .delete()
            .in("id", existingSupplementPlanIds);
          if (error) throw error;
        }

        if (existingWorkoutPlanIds.length > 0) {
          const { error } = await supabase
            .from("workout_plans")
            .delete()
            .in("id", existingWorkoutPlanIds);
          if (error) throw error;
        }

        if (existingLifestylePlanIds.length > 0) {
          const { error } = await supabase
            .from("lifestyle_activity_plans")
            .delete()
            .in("id", existingLifestylePlanIds);
          if (error) throw error;
        }
      }

      // Create new items from template
      const createPromises: Promise<unknown>[] = [];

      // Diet items
      const dietItems = dietItemsQuery.query.data?.data || [];
      for (const item of dietItems) {
        createPromises.push(
          createDietPlan({
            resource: "diet_plans",
            values: {
              client_id: clientId,
              day_number: dayNumber,
              food_item_id: item.food_item_id,
              meal_category: item.meal_category,
              serving_multiplier: item.serving_multiplier,
              time_type: item.time_type,
              time_start: item.time_start,
              time_end: item.time_end,
              time_period: item.time_period,
              relative_anchor: item.relative_anchor,
              relative_offset_minutes: item.relative_offset_minutes,
              notes: item.notes,
              display_order: item.display_order,
            },
          })
        );
      }

      // Supplement items
      const supplementItems = supplementItemsQuery.query.data?.data || [];
      for (const item of supplementItems) {
        createPromises.push(
          createSupplementPlan({
            resource: "supplement_plans",
            values: {
              client_id: clientId,
              day_number: dayNumber,
              supplement_id: item.supplement_id,
              dosage: item.dosage,
              time_type: item.time_type,
              time_start: item.time_start,
              time_end: item.time_end,
              time_period: item.time_period,
              relative_anchor: item.relative_anchor,
              relative_offset_minutes: item.relative_offset_minutes,
              notes: item.notes,
              display_order: item.display_order,
              is_active: true,
            },
          })
        );
      }

      // Workout items
      const workoutItems = workoutItemsQuery.query.data?.data || [];
      for (const item of workoutItems) {
        createPromises.push(
          createWorkoutPlan({
            resource: "workout_plans",
            values: {
              client_id: clientId,
              day_number: dayNumber,
              exercise_id: item.exercise_id,
              // exercise_name is NOT NULL in workout_plans, so fall back to exercise library name
              exercise_name: item.exercise_name || item.exercises?.name || "Exercise",
              section: item.section,
              sets: item.sets,
              reps: item.reps,
              duration_minutes: item.duration_minutes,
              scheduled_duration_minutes: item.scheduled_duration_minutes,
              rest_seconds: item.rest_seconds,
              time_type: item.time_type,
              time_start: item.time_start,
              time_end: item.time_end,
              time_period: item.time_period,
              relative_anchor: item.relative_anchor,
              relative_offset_minutes: item.relative_offset_minutes,
              // Map template 'notes' to workout_plans 'instructions'
              instructions: item.notes,
              display_order: item.display_order,
            },
          })
        );
      }

      // Lifestyle items
      const lifestyleItems = lifestyleItemsQuery.query.data?.data || [];
      for (const item of lifestyleItems) {
        createPromises.push(
          createLifestylePlan({
            resource: "lifestyle_activity_plans",
            values: {
              client_id: clientId,
              day_number: dayNumber,
              // Map template 'lifestyle_activity_type_id' to plan 'activity_type_id'
              activity_type_id: item.lifestyle_activity_type_id,
              target_value: item.target_value,
              time_type: item.time_type,
              time_start: item.time_start,
              time_end: item.time_end,
              time_period: item.time_period,
              relative_anchor: item.relative_anchor,
              relative_offset_minutes: item.relative_offset_minutes,
              notes: item.notes,
              display_order: item.display_order,
            },
          })
        );
      }

      await Promise.all(createPromises);

      const totalItems =
        dietItems.length + supplementItems.length + workoutItems.length + lifestyleItems.length;

      toast.success(`Applied ${totalItems} items from "${selectedTemplate?.name}"`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to apply template:", error);
      toast.error("Failed to apply template");
    } finally {
      setIsApplying(false);
    }
  }, [
    selectedTemplateId,
    selectedTemplate,
    applyMode,
    clientId,
    dayNumber,
    existingDietPlanIds,
    existingSupplementPlanIds,
    existingWorkoutPlanIds,
    existingLifestylePlanIds,
    dietItemsQuery.query.data,
    supplementItemsQuery.query.data,
    workoutItemsQuery.query.data,
    lifestyleItemsQuery.query.data,
    createDietPlan,
    createSupplementPlan,
    createWorkoutPlan,
    createLifestylePlan,
    onSuccess,
    onClose,
  ]);

  const handleClose = () => {
    if (!isApplying) {
      setSelectedTemplateId(null);
      setSearchQuery("");
      setCategoryFilter("");
      setApplyMode("add");
      onClose();
    }
  };

  const hasExistingItems =
    existingDietPlanIds.length > 0 ||
    existingSupplementPlanIds.length > 0 ||
    existingWorkoutPlanIds.length > 0 ||
    existingLifestylePlanIds.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-xl bg-card p-0 max-h-[90vh] flex flex-col">
        {/* Top accent */}
        <div className="h-1 gradient-electric" />

        <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
          <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-primary" />
            Apply <span className="gradient-athletic">Template</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm">
            Select a template to apply to Day {dayNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="pl-9 bg-secondary border-border"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-10 pr-4 py-2 bg-secondary border border-border text-foreground font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer min-w-[150px]"
              >
                <option value="">All Categories</option>
                {TEMPLATE_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Template List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {templatesQuery.query.isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                <span>Loading templates...</span>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="font-bold">No templates found</p>
                <p className="text-sm">Try adjusting your search or filter</p>
              </div>
            ) : (
              filteredTemplates.map((template) => {
                const itemCount = getItemCount(template);
                const isSelected = selectedTemplateId === template.id;

                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    disabled={isApplying}
                    className={cn(
                      "w-full p-4 text-left rounded border transition-all",
                      isSelected
                        ? "bg-primary/10 border-primary"
                        : "bg-secondary/50 border-border hover:bg-secondary"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold truncate">{template.name}</span>
                          {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                        </div>
                        {template.description && (
                          <p className="text-sm text-muted-foreground truncate mt-0.5">
                            {template.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {template.category && (
                            <span className="text-xs px-2 py-0.5 bg-secondary text-muted-foreground font-bold uppercase tracking-wider">
                              {template.category.replace("_", " ")}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {itemCount} {itemCount === 1 ? "item" : "items"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Apply Mode Toggle */}
          {selectedTemplateId && hasExistingItems && (
            <div className="p-4 bg-secondary/50 border border-border rounded space-y-3">
              <p className="text-sm font-bold text-muted-foreground">
                Day {dayNumber} already has items. How would you like to apply this template?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setApplyMode("add")}
                  disabled={isApplying}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded border text-sm font-bold transition-all",
                    applyMode === "add"
                      ? "bg-primary/10 border-primary text-foreground"
                      : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Plus className="h-4 w-4" />
                  <span>Add to existing</span>
                </button>
                <button
                  onClick={() => setApplyMode("replace")}
                  disabled={isApplying}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded border text-sm font-bold transition-all",
                    applyMode === "replace"
                      ? "bg-destructive/10 border-destructive text-foreground"
                      : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Replace all</span>
                </button>
              </div>
              {applyMode === "replace" && (
                <p className="text-xs text-amber-400">
                  Warning: This will delete all existing items on Day {dayNumber} before applying
                  the template.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-0 flex gap-3 shrink-0">
          <button
            onClick={handleClose}
            disabled={isApplying}
            className="btn-athletic flex-1 px-4 py-3 bg-secondary text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={isApplying || !selectedTemplateId}
            className={cn(
              "btn-athletic flex-1 flex items-center justify-center gap-2 px-4 py-3 gradient-electric text-black font-bold",
              (isApplying || !selectedTemplateId) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isApplying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Applying...</span>
              </>
            ) : (
              <>
                <LayoutTemplate className="h-4 w-4" />
                <span>Apply Template</span>
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
