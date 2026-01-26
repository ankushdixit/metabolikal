"use client";

import { useState } from "react";
import { useCreate } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { FoodItemForm } from "@/components/admin/food-item-form";
import { foodItemSchema, type FoodItemFormData } from "@/lib/validations";
import { createBrowserSupabaseClient } from "@/lib/auth";

/**
 * Create Food Item Page
 * Form for adding new food items to the database
 */
export default function CreateFoodItemPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Create mutation
  const createMutation = useCreate();

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FoodItemFormData>({
    resolver: zodResolver(foodItemSchema),
    defaultValues: {
      name: "",
      calories: undefined,
      protein: undefined,
      carbs: null,
      fats: null,
      serving_size: "",
      is_vegetarian: false,
      meal_types: [],
      raw_quantity: null,
      cooked_quantity: null,
      avoid_for_conditions: [],
      alternative_food_ids: [],
    },
  });

  // Handle form submission
  const onSubmit = handleSubmit(async (data) => {
    setIsSaving(true);

    // Extract junction table data
    const avoidForConditions = data.avoid_for_conditions || [];
    const alternativeFoodIds = data.alternative_food_ids || [];

    // Clean up data - convert empty strings and NaN to null for optional fields
    const cleanData = {
      name: data.name,
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs && !isNaN(data.carbs) ? data.carbs : null,
      fats: data.fats && !isNaN(data.fats) ? data.fats : null,
      serving_size: data.serving_size,
      is_vegetarian: data.is_vegetarian,
      meal_types: data.meal_types && data.meal_types.length > 0 ? data.meal_types : null,
      raw_quantity: data.raw_quantity?.trim() || null,
      cooked_quantity: data.cooked_quantity?.trim() || null,
    };

    createMutation.mutate(
      {
        resource: "food_items",
        values: cleanData,
      },
      {
        onSuccess: async (response) => {
          const foodItemId = response.data.id;
          const supabase = createBrowserSupabaseClient();

          try {
            // Save avoid-for conditions
            if (avoidForConditions.length > 0) {
              const conditionInserts = avoidForConditions.map((conditionId) => ({
                food_item_id: foodItemId,
                condition_id: conditionId,
              }));
              await supabase.from("food_item_conditions").insert(conditionInserts);
            }

            // Save alternatives
            if (alternativeFoodIds.length > 0) {
              const alternativeInserts = alternativeFoodIds.map((altId, index) => ({
                food_item_id: foodItemId,
                alternative_food_id: altId,
                display_order: index,
              }));
              await supabase.from("food_item_alternatives").insert(alternativeInserts);
            }

            toast.success("Food item created successfully!");
            router.push("/admin/config/food-items");
          } catch (error) {
            console.error("Error saving relationships:", error);
            // Food item was still created, just show partial success
            toast.warning("Food item created, but some relationships failed to save.");
            router.push("/admin/config/food-items");
          } finally {
            setIsSaving(false);
          }
        },
        onError: () => {
          setIsSaving(false);
        },
      }
    );
  });

  const handleCancel = () => {
    router.push("/admin/config/food-items");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/config/food-items"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm uppercase tracking-wider transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Food Items</span>
      </Link>

      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
          Add <span className="gradient-athletic">Food Item</span>
        </h1>
        <p className="text-sm text-muted-foreground font-bold">
          Create a new food item for diet plans
        </p>
      </div>

      {/* Form */}
      <div className="athletic-card p-6 pl-8">
        <form onSubmit={onSubmit}>
          <FoodItemForm
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            isSubmitting={createMutation.mutation.isPending || isSaving}
            onCancel={handleCancel}
            submitLabel="Create Food Item"
          />
        </form>
      </div>
    </div>
  );
}
