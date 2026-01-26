/**
 * Unified Timeline Plan Editor Page
 *
 * Allows admins to manage a client's complete daily plan - diet, supplements,
 * workouts, and lifestyle activities - all in one timeline view.
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useOne, useList } from "@refinedev/core";
import { ArrowLeft, Plus, Copy, Trash2, RefreshCw, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Profile,
  DietPlan,
  SupplementPlan,
  WorkoutPlan,
  LifestyleActivityPlan,
  TimelineItemType,
  FoodItem,
  Supplement,
  Exercise,
  LifestyleActivityType,
} from "@/lib/database.types";
import {
  useTimelineData,
  type ExtendedTimelineItem,
  type DietPlanWithFood,
  type WorkoutPlanWithExercise,
  type SupplementPlanWithSupplement,
  type LifestyleActivityPlanWithType,
} from "@/hooks/use-timeline-data";
import {
  DaySelectorTabs,
  TimelineGrid,
  AddItemModal,
  MealItemForm,
  SupplementItemForm,
  WorkoutItemForm,
  LifestyleItemForm,
  CopyDayModal,
  ClearDayDialog,
} from "@/components/admin/timeline-editor";
import { GroupedMealModal } from "@/components/admin/timeline-editor/grouped-meal-modal";
import { GroupedWorkoutModal } from "@/components/admin/timeline-editor/grouped-workout-modal";
import { GroupedSupplementModal } from "@/components/admin/timeline-editor/grouped-supplement-modal";
import { GroupedLifestyleModal } from "@/components/admin/timeline-editor/grouped-lifestyle-modal";

// Filter state for showing/hiding item types
interface TypeFilters {
  meal: boolean;
  supplement: boolean;
  workout: boolean;
  lifestyle: boolean;
}

// Modal state type
type ModalType =
  | "addItem"
  | "addMeal"
  | "addSupplement"
  | "addWorkout"
  | "addLifestyle"
  | "editMeal"
  | "editSupplement"
  | "editWorkout"
  | "editLifestyle"
  | "groupedMeal"
  | "groupedWorkout"
  | "groupedSupplement"
  | "groupedLifestyle"
  | "copyDay"
  | "copySelected"
  | "clearDay"
  | null;

/**
 * Unified Timeline Plan Editor
 */
export default function UnifiedTimelinePlanEditorPage() {
  const params = useParams();
  const clientId = params.id as string;

  // UI State
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [typeFilters, setTypeFilters] = useState<TypeFilters>({
    meal: true,
    supplement: true,
    workout: true,
    lifestyle: true,
  });

  // Modal state
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [editingItem, setEditingItem] = useState<ExtendedTimelineItem | null>(null);
  const [viewingGroupedItem, setViewingGroupedItem] = useState<ExtendedTimelineItem | null>(null);

  // Fetch client profile
  const profileQuery = useOne<Profile>({
    resource: "profiles",
    id: clientId,
    queryOptions: {
      enabled: !!clientId,
    },
  });

  // Fetch timeline data for selected day
  const {
    timelineItems,
    packingItems,
    isLoading: isTimelineLoading,
    refetchAll,
    dietItems,
    supplementItems,
    workoutItems,
    lifestyleItems,
    rawDietPlans,
    rawSupplementPlans,
    rawWorkoutPlans,
    rawLifestyleActivityPlans,
    planConfig,
  } = useTimelineData({
    clientId,
    dayNumber: selectedDay,
    enabled: !!clientId,
  });

  // Fetch all days to show content indicators
  const allDietPlansQuery = useList<DietPlan>({
    resource: "diet_plans",
    filters: [{ field: "client_id", operator: "eq", value: clientId }],
    pagination: { pageSize: 1000 },
    queryOptions: {
      enabled: !!clientId,
    },
  });

  const allSupplementPlansQuery = useList<SupplementPlan>({
    resource: "supplement_plans",
    filters: [{ field: "client_id", operator: "eq", value: clientId }],
    pagination: { pageSize: 1000 },
    queryOptions: {
      enabled: !!clientId,
    },
  });

  const allWorkoutPlansQuery = useList<WorkoutPlan>({
    resource: "workout_plans",
    filters: [{ field: "client_id", operator: "eq", value: clientId }],
    pagination: { pageSize: 1000 },
    queryOptions: {
      enabled: !!clientId,
    },
  });

  const allLifestyleActivityPlansQuery = useList<LifestyleActivityPlan>({
    resource: "lifestyle_activity_plans",
    filters: [{ field: "client_id", operator: "eq", value: clientId }],
    pagination: { pageSize: 1000 },
    queryOptions: {
      enabled: !!clientId,
    },
  });

  // Calculate which days have content
  const daysWithContent = useMemo(() => {
    const days = new Set<number>();

    const allPlans = [
      ...(allDietPlansQuery.query.data?.data || []),
      ...(allSupplementPlansQuery.query.data?.data || []),
      ...(allWorkoutPlansQuery.query.data?.data || []),
      ...(allLifestyleActivityPlansQuery.query.data?.data || []),
    ];

    for (const plan of allPlans) {
      if (plan.day_number) {
        days.add(plan.day_number);
      }
    }

    return Array.from(days);
  }, [
    allDietPlansQuery.query.data,
    allSupplementPlansQuery.query.data,
    allWorkoutPlansQuery.query.data,
    allLifestyleActivityPlansQuery.query.data,
  ]);

  // Filter items based on type filters
  const filteredItems = useMemo(() => {
    return timelineItems.filter((item) => typeFilters[item.type]);
  }, [timelineItems, typeFilters]);

  const filteredPackingItems = useMemo(() => {
    return packingItems.filter((item) => typeFilters[item.type]);
  }, [packingItems, typeFilters]);

  // Get selected items for copy selected functionality
  const selectedItems = useMemo(() => {
    return filteredItems.filter((item) => selectedItemIds.has(item.id));
  }, [filteredItems, selectedItemIds]);

  // Filter raw plans based on selected items for Copy Selected modal
  // For grouped items, expand groupedSourceIds to get all underlying items
  const selectedRawDietPlans = useMemo(() => {
    const selectedSourceIds = new Set<string>();
    for (const item of selectedItems) {
      if (item.type === "meal") {
        if (item.isGrouped && item.groupedSourceIds) {
          // Expand grouped item to all underlying source IDs
          for (const id of item.groupedSourceIds) {
            selectedSourceIds.add(id);
          }
        } else {
          selectedSourceIds.add(item.sourceId);
        }
      }
    }
    // Sort by display_order to preserve order when copying
    return rawDietPlans
      .filter((p) => selectedSourceIds.has(p.id))
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }, [selectedItems, rawDietPlans]);

  const selectedRawSupplementPlans = useMemo(() => {
    const selectedSourceIds = new Set<string>();
    for (const item of selectedItems) {
      if (item.type === "supplement") {
        if (item.isGrouped && item.groupedSourceIds) {
          for (const id of item.groupedSourceIds) {
            selectedSourceIds.add(id);
          }
        } else {
          selectedSourceIds.add(item.sourceId);
        }
      }
    }
    return rawSupplementPlans
      .filter((p) => selectedSourceIds.has(p.id))
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }, [selectedItems, rawSupplementPlans]);

  const selectedRawWorkoutPlans = useMemo(() => {
    const selectedSourceIds = new Set<string>();
    for (const item of selectedItems) {
      if (item.type === "workout") {
        if (item.isGrouped && item.groupedSourceIds) {
          for (const id of item.groupedSourceIds) {
            selectedSourceIds.add(id);
          }
        } else {
          selectedSourceIds.add(item.sourceId);
        }
      }
    }
    return rawWorkoutPlans
      .filter((p) => selectedSourceIds.has(p.id))
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }, [selectedItems, rawWorkoutPlans]);

  const selectedRawLifestylePlans = useMemo(() => {
    const selectedSourceIds = new Set<string>();
    for (const item of selectedItems) {
      if (item.type === "lifestyle") {
        if (item.isGrouped && item.groupedSourceIds) {
          for (const id of item.groupedSourceIds) {
            selectedSourceIds.add(id);
          }
        } else {
          selectedSourceIds.add(item.sourceId);
        }
      }
    }
    return rawLifestyleActivityPlans
      .filter((p) => selectedSourceIds.has(p.id))
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }, [selectedItems, rawLifestyleActivityPlans]);

  // Modal handlers
  const openAddItemModal = useCallback(() => {
    setActiveModal("addItem");
  }, []);

  const handleSelectItemType = useCallback((type: TimelineItemType) => {
    // Clear any previous editing item so we're in "add" mode
    setEditingItem(null);
    switch (type) {
      case "meal":
        setActiveModal("addMeal");
        break;
      case "supplement":
        setActiveModal("addSupplement");
        break;
      case "workout":
        setActiveModal("addWorkout");
        break;
      case "lifestyle":
        setActiveModal("addLifestyle");
        break;
    }
  }, []);

  const openCopyDayModal = useCallback(() => {
    setActiveModal("copyDay");
  }, []);

  const openClearDayDialog = useCallback(() => {
    setActiveModal("clearDay");
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setEditingItem(null);
  }, []);

  const handleModalSuccess = useCallback(() => {
    refetchAll();
    closeModal();
    setSelectedItemIds(new Set()); // Clear selection after copy/delete operations
  }, [refetchAll, closeModal]);

  // Item click handler - opens edit modal
  const handleItemClick = useCallback((item: ExtendedTimelineItem) => {
    // Handle grouped items - open the grouped modal
    if (item.isGrouped) {
      setViewingGroupedItem(item);
      switch (item.type) {
        case "meal":
          setActiveModal("groupedMeal");
          break;
        case "workout":
          setActiveModal("groupedWorkout");
          break;
        case "supplement":
          setActiveModal("groupedSupplement");
          break;
        case "lifestyle":
          setActiveModal("groupedLifestyle");
          break;
      }
      return;
    }

    // Handle single items - open the edit modal
    setEditingItem(item);
    switch (item.sourceType) {
      case "diet_plan":
        setActiveModal("editMeal");
        break;
      case "supplement_plan":
        setActiveModal("editSupplement");
        break;
      case "workout_plan":
        setActiveModal("editWorkout");
        break;
      case "lifestyle_activity_plan":
        setActiveModal("editLifestyle");
        break;
    }
  }, []);

  // Item selection handler
  const handleItemSelect = useCallback((itemId: string, selected: boolean) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(itemId);
      } else {
        next.delete(itemId);
      }
      return next;
    });
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedItemIds(new Set());
  }, []);

  // Handlers for adding items from grouped modal
  const handleAddItemFromGroupedMeal = useCallback(() => {
    // Clear editing item so we're in "add" mode, not "edit" mode
    setEditingItem(null);
    setActiveModal("addMeal");
  }, []);

  const handleAddItemFromGroupedWorkout = useCallback(() => {
    // Clear editing item so we're in "add" mode, not "edit" mode
    setEditingItem(null);
    setActiveModal("addWorkout");
  }, []);

  // Handlers for editing items from grouped modal
  const handleEditItemFromGroupedMeal = useCallback(
    (plan: DietPlanWithFood) => {
      // Find the corresponding timeline item
      const item = rawDietPlans.find((p) => p.id === plan.id);
      if (item) {
        // Create a minimal ExtendedTimelineItem for the edit form
        setEditingItem({
          id: plan.id,
          type: "meal",
          title: plan.food_items?.name || "Unknown",
          scheduling: {
            time_type: plan.time_type || "period",
            time_start: plan.time_start,
            time_end: plan.time_end,
            time_period: plan.time_period,
            relative_anchor: plan.relative_anchor,
            relative_offset_minutes: plan.relative_offset_minutes || 0,
          },
          sourceType: "diet_plan",
          sourceId: plan.id,
          dayNumber: plan.day_number,
        });
        setActiveModal("editMeal");
      }
    },
    [rawDietPlans]
  );

  const handleEditItemFromGroupedWorkout = useCallback((plan: WorkoutPlanWithExercise) => {
    setEditingItem({
      id: plan.id,
      type: "workout",
      title: plan.exercise_name || plan.exercises?.name || "Unknown",
      scheduling: {
        time_type: plan.time_type || "period",
        time_start: plan.time_start,
        time_end: plan.time_end,
        time_period: plan.time_period,
        relative_anchor: plan.relative_anchor,
        relative_offset_minutes: plan.relative_offset_minutes || 0,
      },
      sourceType: "workout_plan",
      sourceId: plan.id,
      dayNumber: plan.day_number,
    });
    setActiveModal("editWorkout");
  }, []);

  const handleEditItemFromGroupedSupplement = useCallback((plan: SupplementPlanWithSupplement) => {
    setEditingItem({
      id: plan.id,
      type: "supplement",
      title: plan.supplements?.name || "Unknown",
      scheduling: {
        time_type: plan.time_type || "period",
        time_start: plan.time_start,
        time_end: plan.time_end,
        time_period: plan.time_period,
        relative_anchor: plan.relative_anchor,
        relative_offset_minutes: plan.relative_offset_minutes || 0,
      },
      sourceType: "supplement_plan",
      sourceId: plan.id,
      dayNumber: plan.day_number,
    });
    setActiveModal("editSupplement");
  }, []);

  const handleEditItemFromGroupedLifestyle = useCallback((plan: LifestyleActivityPlanWithType) => {
    setEditingItem({
      id: plan.id,
      type: "lifestyle",
      title: plan.lifestyle_activity_types?.name || "Unknown",
      scheduling: {
        time_type: plan.time_type || "all_day",
        time_start: plan.time_start,
        time_end: plan.time_end,
        time_period: plan.time_period,
        relative_anchor: plan.relative_anchor,
        relative_offset_minutes: plan.relative_offset_minutes || 0,
      },
      sourceType: "lifestyle_activity_plan",
      sourceId: plan.id,
      dayNumber: plan.day_number,
    });
    setActiveModal("editLifestyle");
  }, []);

  // Handlers for adding items from grouped modals
  const handleAddItemFromGroupedSupplement = useCallback(() => {
    setEditingItem(null);
    setActiveModal("addSupplement");
  }, []);

  const handleAddItemFromGroupedLifestyle = useCallback(() => {
    setEditingItem(null);
    setActiveModal("addLifestyle");
  }, []);

  // Copy selected items
  const handleCopySelected = useCallback(() => {
    if (selectedItemIds.size === 0) return;
    setActiveModal("copySelected");
  }, [selectedItemIds]);

  // Toggle type filter
  const toggleTypeFilter = useCallback((type: keyof TypeFilters) => {
    setTypeFilters((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  }, []);

  // Toggle all filters
  const toggleAllFilters = useCallback(() => {
    const allEnabled = Object.values(typeFilters).every(Boolean);
    setTypeFilters({
      meal: !allEnabled,
      supplement: !allEnabled,
      workout: !allEnabled,
      lifestyle: !allEnabled,
    });
  }, [typeFilters]);

  const profile = profileQuery.query.data?.data;
  const isLoading = profileQuery.query.isLoading || isTimelineLoading;

  // Count items by type for the filter badges
  const itemCounts = useMemo(
    () => ({
      meal: dietItems.length,
      supplement: supplementItems.length,
      workout: workoutItems.length,
      lifestyle: lifestyleItems.length,
    }),
    [dietItems, supplementItems, workoutItems, lifestyleItems]
  );

  // Get raw edit item data
  const editDietPlan =
    editingItem?.sourceType === "diet_plan"
      ? (rawDietPlans.find((p) => p.id === editingItem.sourceId) as DietPlan & {
          food_items?: FoodItem | null;
        })
      : undefined;

  const editSupplementPlan =
    editingItem?.sourceType === "supplement_plan"
      ? (rawSupplementPlans.find((p) => p.id === editingItem.sourceId) as SupplementPlan & {
          supplements?: Supplement | null;
        })
      : undefined;

  const editWorkoutPlan =
    editingItem?.sourceType === "workout_plan"
      ? (rawWorkoutPlans.find((p) => p.id === editingItem.sourceId) as WorkoutPlan & {
          exercises?: Exercise | null;
        })
      : undefined;

  const editLifestylePlan =
    editingItem?.sourceType === "lifestyle_activity_plan"
      ? (rawLifestyleActivityPlans.find(
          (p) => p.id === editingItem.sourceId
        ) as LifestyleActivityPlan & { lifestyle_activity_types?: LifestyleActivityType | null })
      : undefined;

  if (profileQuery.query.isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="athletic-card p-6 pl-8 animate-pulse">
          <div className="h-4 w-32 bg-secondary mb-4" />
          <div className="h-8 w-64 bg-secondary mb-4" />
          <div className="h-4 w-48 bg-secondary" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="athletic-card p-8 pl-10 text-center">
          <p className="text-muted-foreground font-bold">Client not found</p>
          <Link
            href="/admin/clients"
            className="btn-athletic inline-flex items-center gap-2 px-4 py-2 mt-4 bg-secondary text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Clients</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href={`/admin/clients/${clientId}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm uppercase tracking-wider transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Client</span>
      </Link>

      {/* Header */}
      <div className="athletic-card p-6 pl-8">
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
          Plan <span className="gradient-athletic">Editor</span>
        </h1>
        <p className="text-muted-foreground font-bold mt-1">{profile.full_name}</p>
      </div>

      {/* Day Selector */}
      <div className="athletic-card p-4 pl-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <DaySelectorTabs
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            daysWithContent={daysWithContent}
            totalDays={planConfig.durationDays}
            planStartDate={planConfig.startDate}
          />

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={openAddItemModal}
              className="btn-athletic flex items-center gap-2 px-4 py-2 gradient-electric text-black text-sm font-bold"
            >
              <Plus className="h-4 w-4" />
              <span>Add Item</span>
            </button>

            <button
              onClick={openCopyDayModal}
              disabled={filteredItems.length === 0}
              className={cn(
                "btn-athletic flex items-center gap-2 px-4 py-2 bg-secondary text-foreground text-sm font-bold",
                filteredItems.length === 0 && "opacity-50 cursor-not-allowed"
              )}
            >
              <Copy className="h-4 w-4" />
              <span>Copy Day</span>
            </button>

            <button
              onClick={openClearDayDialog}
              disabled={filteredItems.length === 0}
              className={cn(
                "btn-athletic flex items-center gap-2 px-4 py-2 bg-secondary text-foreground text-sm font-bold",
                filteredItems.length === 0 && "opacity-50 cursor-not-allowed"
              )}
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear Day</span>
            </button>

            <button
              onClick={refetchAll}
              className="btn-athletic p-2 bg-secondary text-foreground"
              title="Refresh"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Selection actions (when items are selected) */}
        {selectedItemIds.size > 0 && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded">
            <span className="text-sm font-bold text-primary">
              {selectedItemIds.size} item{selectedItemIds.size !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={handleCopySelected}
              className="btn-athletic flex items-center gap-1 px-3 py-1 bg-primary text-black text-xs font-bold"
            >
              <Copy className="h-3 w-3" />
              <span>Copy Selected</span>
            </button>
            <button
              onClick={clearSelection}
              className="btn-athletic px-3 py-1 bg-secondary text-foreground text-xs font-bold"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Type Filters */}
      <div className="athletic-card p-4 pl-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Show:
          </span>

          {(["meal", "supplement", "workout", "lifestyle"] as const).map((type) => {
            const isActive = typeFilters[type];
            const count = itemCounts[type];
            const labels = {
              meal: "Meals",
              supplement: "Supplements",
              workout: "Workouts",
              lifestyle: "Lifestyle",
            };
            const colors = {
              meal: "bg-orange-500/20 border-orange-500/50 text-orange-400",
              supplement: "bg-green-500/20 border-green-500/50 text-green-400",
              workout: "bg-blue-500/20 border-blue-500/50 text-blue-400",
              lifestyle: "bg-purple-500/20 border-purple-500/50 text-purple-400",
            };

            return (
              <button
                key={type}
                onClick={() => toggleTypeFilter(type)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded border text-sm font-bold transition-all",
                  isActive ? colors[type] : "bg-secondary/50 border-border text-muted-foreground"
                )}
              >
                {isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                <span>{labels[type]}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded text-xs",
                    isActive ? "bg-black/20" : "bg-secondary"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}

          <button
            onClick={toggleAllFilters}
            className="text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider ml-2"
          >
            {Object.values(typeFilters).every(Boolean) ? "Hide All" : "Show All"}
          </button>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="athletic-card p-4 overflow-x-auto">
        <TimelineGrid
          items={filteredItems}
          packingItems={filteredPackingItems}
          onItemClick={handleItemClick}
          selectedItemIds={selectedItemIds}
          onItemSelect={handleItemSelect}
          isLoading={isLoading}
        />
      </div>

      {/* Modals */}
      <AddItemModal
        isOpen={activeModal === "addItem"}
        onClose={closeModal}
        onSelectType={handleSelectItemType}
      />

      <MealItemForm
        isOpen={activeModal === "addMeal" || activeModal === "editMeal"}
        onClose={closeModal}
        onSuccess={handleModalSuccess}
        clientId={clientId}
        dayNumber={selectedDay}
        editItem={editDietPlan}
      />

      <SupplementItemForm
        isOpen={activeModal === "addSupplement" || activeModal === "editSupplement"}
        onClose={closeModal}
        onSuccess={handleModalSuccess}
        clientId={clientId}
        dayNumber={selectedDay}
        editItem={editSupplementPlan}
      />

      <WorkoutItemForm
        isOpen={activeModal === "addWorkout" || activeModal === "editWorkout"}
        onClose={closeModal}
        onSuccess={handleModalSuccess}
        clientId={clientId}
        dayNumber={selectedDay}
        editItem={editWorkoutPlan}
      />

      <LifestyleItemForm
        isOpen={activeModal === "addLifestyle" || activeModal === "editLifestyle"}
        onClose={closeModal}
        onSuccess={handleModalSuccess}
        clientId={clientId}
        dayNumber={selectedDay}
        editItem={editLifestylePlan}
      />

      {/* Grouped Item Modals */}
      <GroupedMealModal
        isOpen={activeModal === "groupedMeal"}
        onClose={closeModal}
        onAddItem={handleAddItemFromGroupedMeal}
        onEditItem={handleEditItemFromGroupedMeal}
        item={viewingGroupedItem}
      />

      <GroupedWorkoutModal
        isOpen={activeModal === "groupedWorkout"}
        onClose={closeModal}
        onAddItem={handleAddItemFromGroupedWorkout}
        onEditItem={handleEditItemFromGroupedWorkout}
        item={viewingGroupedItem}
      />

      <GroupedSupplementModal
        isOpen={activeModal === "groupedSupplement"}
        onClose={closeModal}
        onAddItem={handleAddItemFromGroupedSupplement}
        onEditItem={handleEditItemFromGroupedSupplement}
        item={viewingGroupedItem}
      />

      <GroupedLifestyleModal
        isOpen={activeModal === "groupedLifestyle"}
        onClose={closeModal}
        onAddItem={handleAddItemFromGroupedLifestyle}
        onEditItem={handleEditItemFromGroupedLifestyle}
        item={viewingGroupedItem}
      />

      <CopyDayModal
        isOpen={activeModal === "copyDay"}
        onClose={closeModal}
        onSuccess={handleModalSuccess}
        clientId={clientId}
        sourceDay={selectedDay}
        dietPlans={rawDietPlans}
        supplementPlans={rawSupplementPlans}
        workoutPlans={rawWorkoutPlans}
        lifestylePlans={rawLifestyleActivityPlans}
        totalDays={planConfig.durationDays}
        planStartDate={planConfig.startDate}
      />

      <CopyDayModal
        isOpen={activeModal === "copySelected"}
        onClose={closeModal}
        onSuccess={handleModalSuccess}
        clientId={clientId}
        sourceDay={selectedDay}
        dietPlans={selectedRawDietPlans}
        supplementPlans={selectedRawSupplementPlans}
        workoutPlans={selectedRawWorkoutPlans}
        lifestylePlans={selectedRawLifestylePlans}
        totalDays={planConfig.durationDays}
        planStartDate={planConfig.startDate}
      />

      <ClearDayDialog
        isOpen={activeModal === "clearDay"}
        onClose={closeModal}
        onSuccess={handleModalSuccess}
        dayNumber={selectedDay}
        items={filteredItems}
      />
    </div>
  );
}
