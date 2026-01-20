"use client";

import { useState } from "react";
import { useCreate } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FoodItemForm } from "@/components/admin/food-item-form";
import { foodItemSchema, type FoodItemFormData } from "@/lib/validations";

/**
 * Create Food Item Page
 * Form for adding new food items to the database
 */
export default function CreateFoodItemPage() {
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    },
  });

  // Handle form submission
  const onSubmit = handleSubmit((data) => {
    // Clean up data - convert empty strings and NaN to null for optional fields
    const cleanData = {
      ...data,
      carbs: data.carbs && !isNaN(data.carbs) ? data.carbs : null,
      fats: data.fats && !isNaN(data.fats) ? data.fats : null,
      meal_types: data.meal_types && data.meal_types.length > 0 ? data.meal_types : null,
    };

    createMutation.mutate(
      {
        resource: "food_items",
        values: cleanData,
      },
      {
        onSuccess: () => {
          setSuccessMessage("Food item created successfully!");
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
          Add <span className="gradient-athletic">Food Item</span>
        </h1>
        <p className="text-sm text-muted-foreground font-bold">
          Create a new food item for diet plans
        </p>
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
            isSubmitting={createMutation.mutation.isPending}
            onCancel={handleCancel}
            submitLabel="Create Food Item"
          />
        </form>
      </div>
    </div>
  );
}
