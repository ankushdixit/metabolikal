"use client";

import { useState, useEffect, useCallback } from "react";
import { useList } from "@refinedev/core";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { AlternativesLinker, type AlternativeChange } from "@/components/admin/alternatives-linker";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { FoodItem, FoodItemAlternativeRow } from "@/lib/database.types";

/**
 * Food Alternatives Linking Page
 * Visual interface for managing food item alternatives
 */
export default function AlternativesPage() {
  const [adminId, setAdminId] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<AlternativeChange[]>([]);
  const [bidirectional, setBidirectional] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Get current admin user ID
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setAdminId(data.user.id);
      }
    });
  }, []);

  // Fetch all food items
  const foodItemsQuery = useList<FoodItem>({
    resource: "food_items",
    sorters: [{ field: "name", order: "asc" }],
    pagination: { mode: "off" },
    queryOptions: {
      enabled: !!adminId,
    },
  });

  // Fetch all food item alternatives
  const alternativesQuery = useList<FoodItemAlternativeRow>({
    resource: "food_item_alternatives",
    pagination: { mode: "off" },
    queryOptions: {
      enabled: !!adminId,
    },
  });

  const foodItems = foodItemsQuery.query.data?.data || [];
  const alternatives = alternativesQuery.query.data?.data || [];
  const isLoading = foodItemsQuery.query.isLoading || alternativesQuery.query.isLoading;

  const handleChanges = useCallback((changes: AlternativeChange[]) => {
    setPendingChanges(changes);
    setSaveResult(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (pendingChanges.length === 0) return;

    setIsSaving(true);
    setSaveResult(null);

    const supabase = createBrowserSupabaseClient();

    try {
      // Separate adds and removes
      const adds = pendingChanges.filter((c) => c.type === "add");
      const removes = pendingChanges.filter((c) => c.type === "remove");

      // Process removes first
      for (const remove of removes) {
        await supabase
          .from("food_item_alternatives")
          .delete()
          .eq("food_item_id", remove.foodItemId)
          .eq("alternative_food_id", remove.alternativeFoodId);

        // If bidirectional, also remove reverse
        if (bidirectional) {
          await supabase
            .from("food_item_alternatives")
            .delete()
            .eq("food_item_id", remove.alternativeFoodId)
            .eq("alternative_food_id", remove.foodItemId);
        }
      }

      // Process adds
      const insertData: { food_item_id: string; alternative_food_id: string }[] = [];

      for (const add of adds) {
        insertData.push({
          food_item_id: add.foodItemId,
          alternative_food_id: add.alternativeFoodId,
        });

        // If bidirectional, also add reverse
        if (bidirectional) {
          insertData.push({
            food_item_id: add.alternativeFoodId,
            alternative_food_id: add.foodItemId,
          });
        }
      }

      if (insertData.length > 0) {
        const { error } = await supabase
          .from("food_item_alternatives")
          .upsert(insertData, { onConflict: "food_item_id,alternative_food_id" });

        if (error) {
          throw error;
        }
      }

      // Success
      setSaveResult({
        success: true,
        message: `Successfully saved ${pendingChanges.length} changes${bidirectional ? " (bidirectional)" : ""}`,
      });
      setPendingChanges([]);

      // Refresh data
      alternativesQuery.query.refetch();
    } catch (error) {
      setSaveResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to save changes",
      });
    } finally {
      setIsSaving(false);
    }
  }, [pendingChanges, bidirectional, alternativesQuery.query]);

  const addCount = pendingChanges.filter((c) => c.type === "add").length;
  const removeCount = pendingChanges.filter((c) => c.type === "remove").length;
  const hasChanges = pendingChanges.length > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <Link
          href="/admin/config/food-items"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Food Items</span>
        </Link>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
          Manage <span className="gradient-athletic">Alternatives</span>
        </h1>
        <p className="text-sm text-muted-foreground font-bold">
          Link food items to their alternatives for diet plan flexibility
        </p>
      </div>

      {/* Linker */}
      <AlternativesLinker
        foodItems={foodItems}
        alternatives={alternatives}
        isLoading={isLoading}
        onChange={handleChanges}
      />

      {/* Actions Bar */}
      <div className="athletic-card p-6 pl-8 sticky bottom-4 z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Bidirectional Option */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="bidirectional"
              checked={bidirectional}
              onCheckedChange={(checked) => setBidirectional(checked === true)}
              disabled={isSaving}
            />
            <label htmlFor="bidirectional" className="text-sm font-bold cursor-pointer">
              Create bidirectional links
              <span className="block text-xs text-muted-foreground font-normal">
                (if A→B, also create B→A)
              </span>
            </label>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-4">
            {saveResult && (
              <div
                className={cn(
                  "flex items-center gap-2 text-sm font-bold",
                  saveResult.success ? "text-neon-green" : "text-red-500"
                )}
              >
                {saveResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span>{saveResult.message}</span>
              </div>
            )}

            {hasChanges && !saveResult && (
              <div className="text-sm text-muted-foreground font-bold">
                {addCount > 0 && <span className="text-neon-green">+{addCount} to add</span>}
                {addCount > 0 && removeCount > 0 && <span> | </span>}
                {removeCount > 0 && <span className="text-red-500">-{removeCount} to remove</span>}
              </div>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={cn(
                "btn-athletic inline-flex items-center gap-2 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed",
                hasChanges
                  ? "gradient-electric text-black glow-power"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Save All Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
