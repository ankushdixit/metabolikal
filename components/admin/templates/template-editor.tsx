"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimelineGrid } from "@/components/admin/timeline-editor/timeline-grid";
import { AddItemModal } from "@/components/admin/timeline-editor/add-item-modal";
import {
  useTemplateData,
  type ExtendedTemplateTimelineItem,
  type TemplateDietItemWithFood,
  type TemplateWorkoutItemWithExercise,
  type TemplateSupplementItemWithSupplement,
  type TemplateLifestyleItemWithType,
} from "@/hooks/use-template-data";
import type { TimelineItemType } from "@/lib/database.types";
// Import grouped modals for templates (we'll create template-specific versions)
import { TemplateGroupedMealModal } from "./template-grouped-meal-modal";
import { TemplateGroupedWorkoutModal } from "./template-grouped-workout-modal";
import { TemplateGroupedSupplementModal } from "./template-grouped-supplement-modal";
import { TemplateGroupedLifestyleModal } from "./template-grouped-lifestyle-modal";
// Import template item forms
import { TemplateMealItemForm } from "./template-meal-item-form";
import { TemplateSupplementItemForm } from "./template-supplement-item-form";
import { TemplateWorkoutItemForm } from "./template-workout-item-form";
import { TemplateLifestyleItemForm } from "./template-lifestyle-item-form";

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
  | null;

interface TemplateEditorProps {
  templateId: string;
}

/**
 * Template Timeline Editor
 * Reuses the timeline grid component for editing template items
 */
export function TemplateEditor({ templateId }: TemplateEditorProps) {
  // UI State
  const [typeFilters, setTypeFilters] = useState<TypeFilters>({
    meal: true,
    supplement: true,
    workout: true,
    lifestyle: true,
  });

  // Modal state
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [editingItem, setEditingItem] = useState<ExtendedTemplateTimelineItem | null>(null);
  const [viewingGroupedItem, setViewingGroupedItem] = useState<ExtendedTemplateTimelineItem | null>(
    null
  );

  // Fetch template data
  const {
    timelineItems,
    packingItems,
    isLoading,
    refetchAll,
    dietItems,
    supplementItems,
    workoutItems,
    lifestyleItems,
    rawDietItems,
    rawSupplementItems,
    rawWorkoutItems,
    rawLifestyleItems,
  } = useTemplateData({
    templateId,
    enabled: !!templateId,
  });

  // Filter items based on type filters
  const filteredItems = useMemo(() => {
    return timelineItems.filter((item) => typeFilters[item.type]);
  }, [timelineItems, typeFilters]);

  const filteredPackingItems = useMemo(() => {
    return packingItems.filter((item) => typeFilters[item.type]);
  }, [packingItems, typeFilters]);

  // Modal handlers
  const openAddItemModal = useCallback(() => {
    setActiveModal("addItem");
  }, []);

  const handleSelectItemType = useCallback((type: TimelineItemType) => {
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

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setEditingItem(null);
    setViewingGroupedItem(null);
  }, []);

  const handleModalSuccess = useCallback(() => {
    refetchAll();
    closeModal();
  }, [refetchAll, closeModal]);

  // Item click handler - opens edit modal
  const handleItemClick = useCallback((item: ExtendedTemplateTimelineItem) => {
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
      case "template_diet_item":
        setActiveModal("editMeal");
        break;
      case "template_supplement_item":
        setActiveModal("editSupplement");
        break;
      case "template_workout_item":
        setActiveModal("editWorkout");
        break;
      case "template_lifestyle_item":
        setActiveModal("editLifestyle");
        break;
    }
  }, []);

  // Handlers for adding items from grouped modals
  const handleAddItemFromGroupedMeal = useCallback(() => {
    setEditingItem(null);
    setActiveModal("addMeal");
  }, []);

  const handleAddItemFromGroupedWorkout = useCallback(() => {
    setEditingItem(null);
    setActiveModal("addWorkout");
  }, []);

  const handleAddItemFromGroupedSupplement = useCallback(() => {
    setEditingItem(null);
    setActiveModal("addSupplement");
  }, []);

  const handleAddItemFromGroupedLifestyle = useCallback(() => {
    setEditingItem(null);
    setActiveModal("addLifestyle");
  }, []);

  // Handlers for editing items from grouped modal
  const handleEditItemFromGroupedMeal = useCallback(
    (item: TemplateDietItemWithFood) => {
      setEditingItem({
        id: item.id,
        type: "meal",
        title: item.food_items?.name || "Unknown",
        scheduling: {
          time_type: item.time_type || "period",
          time_start: item.time_start,
          time_end: item.time_end,
          time_period: item.time_period,
          relative_anchor: item.relative_anchor,
          relative_offset_minutes: item.relative_offset_minutes || 0,
        },
        sourceType: "template_diet_item",
        sourceId: item.id,
        templateId,
      });
      setActiveModal("editMeal");
    },
    [templateId]
  );

  const handleEditItemFromGroupedWorkout = useCallback(
    (item: TemplateWorkoutItemWithExercise) => {
      setEditingItem({
        id: item.id,
        type: "workout",
        title: item.exercise_name || item.exercises?.name || "Unknown",
        scheduling: {
          time_type: item.time_type || "period",
          time_start: item.time_start,
          time_end: item.time_end,
          time_period: item.time_period,
          relative_anchor: item.relative_anchor,
          relative_offset_minutes: item.relative_offset_minutes || 0,
        },
        sourceType: "template_workout_item",
        sourceId: item.id,
        templateId,
      });
      setActiveModal("editWorkout");
    },
    [templateId]
  );

  const handleEditItemFromGroupedSupplement = useCallback(
    (item: TemplateSupplementItemWithSupplement) => {
      setEditingItem({
        id: item.id,
        type: "supplement",
        title: item.supplements?.name || "Unknown",
        scheduling: {
          time_type: item.time_type || "period",
          time_start: item.time_start,
          time_end: item.time_end,
          time_period: item.time_period,
          relative_anchor: item.relative_anchor,
          relative_offset_minutes: item.relative_offset_minutes || 0,
        },
        sourceType: "template_supplement_item",
        sourceId: item.id,
        templateId,
      });
      setActiveModal("editSupplement");
    },
    [templateId]
  );

  const handleEditItemFromGroupedLifestyle = useCallback(
    (item: TemplateLifestyleItemWithType) => {
      setEditingItem({
        id: item.id,
        type: "lifestyle",
        title: item.lifestyle_activity_types?.name || "Unknown",
        scheduling: {
          time_type: item.time_type || "all_day",
          time_start: item.time_start,
          time_end: item.time_end,
          time_period: item.time_period,
          relative_anchor: item.relative_anchor,
          relative_offset_minutes: item.relative_offset_minutes || 0,
        },
        sourceType: "template_lifestyle_item",
        sourceId: item.id,
        templateId,
      });
      setActiveModal("editLifestyle");
    },
    [templateId]
  );

  // Toggle type filter
  const toggleTypeFilter = useCallback((type: keyof TypeFilters) => {
    setTypeFilters((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  }, []);

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
  const editDietItem =
    editingItem?.sourceType === "template_diet_item"
      ? rawDietItems.find((p) => p.id === editingItem.sourceId)
      : undefined;

  const editSupplementItem =
    editingItem?.sourceType === "template_supplement_item"
      ? rawSupplementItems.find((p) => p.id === editingItem.sourceId)
      : undefined;

  const editWorkoutItem =
    editingItem?.sourceType === "template_workout_item"
      ? rawWorkoutItems.find((p) => p.id === editingItem.sourceId)
      : undefined;

  const editLifestyleItem =
    editingItem?.sourceType === "template_lifestyle_item"
      ? rawLifestyleItems.find((p) => p.id === editingItem.sourceId)
      : undefined;

  if (isLoading) {
    return (
      <div className="athletic-card p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground font-bold">Loading template...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions and Filters */}
      <div className="athletic-card p-4 pl-8">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openAddItemModal}
            className="btn-athletic flex items-center gap-2 px-4 py-2 gradient-electric text-black text-sm font-bold"
          >
            <Plus className="h-4 w-4" />
            <span>Add Item</span>
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Type Filters */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-2">
              Show:
            </span>
            {(["meal", "supplement", "workout", "lifestyle"] as const).map((type) => (
              <button
                key={type}
                onClick={() => toggleTypeFilter(type)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all",
                  typeFilters[type]
                    ? "bg-primary/20 text-primary border border-primary/50"
                    : "bg-secondary text-muted-foreground border border-transparent"
                )}
              >
                {type === "meal" && "Meals"}
                {type === "supplement" && "Supplements"}
                {type === "workout" && "Workouts"}
                {type === "lifestyle" && "Lifestyle"}
                {itemCounts[type] > 0 && (
                  <span className="ml-1 opacity-75">({itemCounts[type]})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="athletic-card overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground font-bold mb-4">No items in this template yet</p>
            <button
              onClick={openAddItemModal}
              className="btn-athletic inline-flex items-center gap-2 px-4 py-2 gradient-electric text-black text-sm font-bold"
            >
              <Plus className="h-4 w-4" />
              <span>Add your first item</span>
            </button>
          </div>
        ) : (
          <TimelineGrid
            items={filteredItems as any}
            packingItems={filteredPackingItems}
            onItemClick={handleItemClick as any}
          />
        )}
      </div>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={activeModal === "addItem"}
        onClose={closeModal}
        onSelectType={handleSelectItemType}
      />

      {/* Item Forms */}
      <TemplateMealItemForm
        isOpen={activeModal === "addMeal" || activeModal === "editMeal"}
        onClose={closeModal}
        onSuccess={handleModalSuccess}
        templateId={templateId}
        editItem={editDietItem}
      />

      <TemplateSupplementItemForm
        isOpen={activeModal === "addSupplement" || activeModal === "editSupplement"}
        onClose={closeModal}
        onSuccess={handleModalSuccess}
        templateId={templateId}
        editItem={editSupplementItem}
      />

      <TemplateWorkoutItemForm
        isOpen={activeModal === "addWorkout" || activeModal === "editWorkout"}
        onClose={closeModal}
        onSuccess={handleModalSuccess}
        templateId={templateId}
        editItem={editWorkoutItem}
      />

      <TemplateLifestyleItemForm
        isOpen={activeModal === "addLifestyle" || activeModal === "editLifestyle"}
        onClose={closeModal}
        onSuccess={handleModalSuccess}
        templateId={templateId}
        editItem={editLifestyleItem}
      />

      {/* Grouped Modals */}
      <TemplateGroupedMealModal
        isOpen={activeModal === "groupedMeal"}
        onClose={closeModal}
        onAddItem={handleAddItemFromGroupedMeal}
        onEditItem={handleEditItemFromGroupedMeal}
        item={viewingGroupedItem}
      />

      <TemplateGroupedWorkoutModal
        isOpen={activeModal === "groupedWorkout"}
        onClose={closeModal}
        onAddItem={handleAddItemFromGroupedWorkout}
        onEditItem={handleEditItemFromGroupedWorkout}
        item={viewingGroupedItem}
      />

      <TemplateGroupedSupplementModal
        isOpen={activeModal === "groupedSupplement"}
        onClose={closeModal}
        onAddItem={handleAddItemFromGroupedSupplement}
        onEditItem={handleEditItemFromGroupedSupplement}
        item={viewingGroupedItem}
      />

      <TemplateGroupedLifestyleModal
        isOpen={activeModal === "groupedLifestyle"}
        onClose={closeModal}
        onAddItem={handleAddItemFromGroupedLifestyle}
        onEditItem={handleEditItemFromGroupedLifestyle}
        item={viewingGroupedItem}
      />
    </div>
  );
}
