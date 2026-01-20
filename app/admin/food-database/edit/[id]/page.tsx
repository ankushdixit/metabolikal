"use client";

import { useState, useEffect } from "react";
import { useOne, useUpdate } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FoodItemForm } from "@/components/admin/food-item-form";
import { foodItemSchema, type FoodItemFormData } from "@/lib/validations";
import type { FoodItem } from "@/lib/database.types";

/**
 * Edit Food Item Page
 * Form for editing existing food items in the database
 */
export default function EditFoodItemPage() {
  const router = useRouter();
  const params = useParams();
  const foodItemId = params.id as string;

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isFormReady, setIsFormReady] = useState(false);

  // Fetch existing food item
  const foodItemQuery = useOne<FoodItem>({
    resource: "food_items",
    id: foodItemId,
    queryOptions: {
      enabled: !!foodItemId,
    },
  });

  const foodItem = foodItemQuery.query.data?.data;

  // Update mutation
  const updateMutation = useUpdate();

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
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
    },
  });

  // Populate form with existing data
  useEffect(() => {
    if (foodItem && !isFormReady) {
      reset({
        name: foodItem.name,
        calories: foodItem.calories,
        protein: foodItem.protein,
        carbs: foodItem.carbs,
        fats: foodItem.fats,
        serving_size: foodItem.serving_size,
        is_vegetarian: foodItem.is_vegetarian,
        meal_types: (foodItem.meal_types as FoodItemFormData["meal_types"]) || [],
      });
      setIsFormReady(true);
    }
  }, [foodItem, reset, isFormReady]);

  // Handle form submission
  const onSubmit = handleSubmit((data) => {
    // Clean up data - convert empty strings and NaN to null for optional fields
    const cleanData = {
      ...data,
      carbs: data.carbs && !isNaN(data.carbs) ? data.carbs : null,
      fats: data.fats && !isNaN(data.fats) ? data.fats : null,
      meal_types: data.meal_types && data.meal_types.length > 0 ? data.meal_types : null,
    };

    updateMutation.mutate(
      {
        resource: "food_items",
        id: foodItemId,
        values: cleanData,
      },
      {
        onSuccess: () => {
          setSuccessMessage("Food item updated successfully!");
          setTimeout(() => {
            router.push("/admin/food-database");
          }, 1500);
        },
      }
    );
  });

  const handleCancel = () => {
    router.push("/admin/food-database");
  };

  // Loading state
  if (foodItemQuery.query.isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="athletic-card p-6 pl-8 animate-pulse">
          <div className="h-4 w-32 bg-secondary mb-4" />
          <div className="h-8 w-64 bg-secondary mb-4" />
          <div className="h-4 w-48 bg-secondary" />
        </div>
      </div>
    );
  }

  // Not found state
  if (!foodItem) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="athletic-card p-8 pl-10 text-center">
          <p className="text-muted-foreground font-bold">Food item not found</p>
          <Link
            href="/admin/food-database"
            className="btn-athletic inline-flex items-center gap-2 px-4 py-2 mt-4 bg-secondary text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Food Database</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/food-database"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm uppercase tracking-wider transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Food Database</span>
      </Link>

      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
          Edit <span className="gradient-athletic">Food Item</span>
        </h1>
        <p className="text-sm text-muted-foreground font-bold">Update food item: {foodItem.name}</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="athletic-card p-4 pl-8 bg-neon-green/20 border-neon-green/50">
          <p className="text-neon-green font-bold">{successMessage}</p>
        </div>
      )}

      {/* Form */}
      <div className="athletic-card p-6 pl-8">
        <form onSubmit={onSubmit}>
          <FoodItemForm
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            isSubmitting={updateMutation.mutation.isPending}
            onCancel={handleCancel}
            submitLabel="Save Changes"
          />
        </form>
      </div>
    </div>
  );
}
