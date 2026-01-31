"use client";

import { useEffect, useState } from "react";
import { useList, useUpdate } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { CalculatorSettingsForm } from "@/components/admin/calculator-settings-form";
import { calculatorSettingsSchema, CalculatorSettingsFormData } from "@/lib/validations";
import type { CalculatorSettingsRow } from "@/lib/database.types";
import { DEFAULT_CALCULATOR_SETTINGS } from "@/hooks/use-calculator-settings";

/**
 * Admin Calculator Settings Page
 * Single page to configure all calculator formulas and parameters
 */
export default function CalculatorSettingsPage() {
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch the singleton settings row using useList (singleton table has only one row)
  const settingsQuery = useList<CalculatorSettingsRow>({
    resource: "calculator_settings",
    pagination: { mode: "off" },
    queryOptions: {
      retry: 1,
    },
  });

  const settingsData = settingsQuery.query.data?.data;
  const settings = settingsData && settingsData.length > 0 ? settingsData[0] : undefined;
  const isLoading = settingsQuery.query.isLoading;
  const fetchError = settingsQuery.query.error;

  // Update mutation
  const { mutate: updateSettings } = useUpdate();

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CalculatorSettingsFormData>({
    resolver: zodResolver(calculatorSettingsSchema),
    defaultValues: {
      // Activity Multipliers
      activity_sedentary: DEFAULT_CALCULATOR_SETTINGS.activity_sedentary,
      activity_lightly_active: DEFAULT_CALCULATOR_SETTINGS.activity_lightly_active,
      activity_moderately_active: DEFAULT_CALCULATOR_SETTINGS.activity_moderately_active,
      activity_very_active: DEFAULT_CALCULATOR_SETTINGS.activity_very_active,
      activity_extremely_active: DEFAULT_CALCULATOR_SETTINGS.activity_extremely_active,

      // Goal Adjustments
      goal_fat_loss_adjustment: DEFAULT_CALCULATOR_SETTINGS.goal_fat_loss_adjustment,
      goal_maintain_adjustment: 0,
      goal_muscle_gain_adjustment: DEFAULT_CALCULATOR_SETTINGS.goal_muscle_gain_adjustment,

      // Protein Ratios
      protein_fat_loss: DEFAULT_CALCULATOR_SETTINGS.protein_fat_loss,
      protein_maintain: DEFAULT_CALCULATOR_SETTINGS.protein_maintain,
      protein_muscle_gain: DEFAULT_CALCULATOR_SETTINGS.protein_muscle_gain,

      // Health Score Configuration
      health_score_lifestyle_weight: DEFAULT_CALCULATOR_SETTINGS.health_score_lifestyle_weight,
      health_score_physical_weight: DEFAULT_CALCULATOR_SETTINGS.health_score_physical_weight,
      health_score_calorie_bonus: DEFAULT_CALCULATOR_SETTINGS.health_score_calorie_bonus,
      health_score_calorie_min: DEFAULT_CALCULATOR_SETTINGS.health_score_calorie_min,
      health_score_calorie_max: DEFAULT_CALCULATOR_SETTINGS.health_score_calorie_max,

      // Metabolic Impact Cap
      metabolic_impact_cap: DEFAULT_CALCULATOR_SETTINGS.metabolic_impact_cap,

      // Lifestyle Multiplier
      lifestyle_multiplier_enabled: DEFAULT_CALCULATOR_SETTINGS.lifestyle_multiplier_enabled,
      lifestyle_multiplier_divisor: DEFAULT_CALCULATOR_SETTINGS.lifestyle_multiplier_divisor,

      // Physical Score Configuration
      physical_score_base: DEFAULT_CALCULATOR_SETTINGS.physical_score_base,
      physical_score_bmi_optimal: DEFAULT_CALCULATOR_SETTINGS.physical_score_bmi_optimal,
      physical_score_bmi_acceptable: DEFAULT_CALCULATOR_SETTINGS.physical_score_bmi_acceptable,
      physical_score_bmi_outside: DEFAULT_CALCULATOR_SETTINGS.physical_score_bmi_outside,
      physical_score_bodyfat_optimal: DEFAULT_CALCULATOR_SETTINGS.physical_score_bodyfat_optimal,
      physical_score_bodyfat_acceptable:
        DEFAULT_CALCULATOR_SETTINGS.physical_score_bodyfat_acceptable,
      physical_score_bodyfat_outside: DEFAULT_CALCULATOR_SETTINGS.physical_score_bodyfat_outside,

      // BMI Range Definitions
      bmi_optimal_min: DEFAULT_CALCULATOR_SETTINGS.bmi_optimal_min,
      bmi_optimal_max: DEFAULT_CALCULATOR_SETTINGS.bmi_optimal_max,
      bmi_acceptable_min: DEFAULT_CALCULATOR_SETTINGS.bmi_acceptable_min,
      bmi_acceptable_max: DEFAULT_CALCULATOR_SETTINGS.bmi_acceptable_max,

      // Body Fat Range Definitions - Male
      bodyfat_male_optimal_min: DEFAULT_CALCULATOR_SETTINGS.bodyfat_male_optimal_min,
      bodyfat_male_optimal_max: DEFAULT_CALCULATOR_SETTINGS.bodyfat_male_optimal_max,
      bodyfat_male_acceptable_min: DEFAULT_CALCULATOR_SETTINGS.bodyfat_male_acceptable_min,
      bodyfat_male_acceptable_max: DEFAULT_CALCULATOR_SETTINGS.bodyfat_male_acceptable_max,

      // Body Fat Range Definitions - Female
      bodyfat_female_optimal_min: DEFAULT_CALCULATOR_SETTINGS.bodyfat_female_optimal_min,
      bodyfat_female_optimal_max: DEFAULT_CALCULATOR_SETTINGS.bodyfat_female_optimal_max,
      bodyfat_female_acceptable_min: DEFAULT_CALCULATOR_SETTINGS.bodyfat_female_acceptable_min,
      bodyfat_female_acceptable_max: DEFAULT_CALCULATOR_SETTINGS.bodyfat_female_acceptable_max,

      // Health Score Tiers
      health_score_tiers: DEFAULT_CALCULATOR_SETTINGS.health_score_tiers,
    },
  });

  // Reset form when settings load
  useEffect(() => {
    if (settings) {
      reset({
        activity_sedentary: Number(settings.activity_sedentary),
        activity_lightly_active: Number(settings.activity_lightly_active),
        activity_moderately_active: Number(settings.activity_moderately_active),
        activity_very_active: Number(settings.activity_very_active),
        activity_extremely_active: Number(settings.activity_extremely_active),
        goal_fat_loss_adjustment: settings.goal_fat_loss_adjustment,
        goal_maintain_adjustment: 0,
        goal_muscle_gain_adjustment: settings.goal_muscle_gain_adjustment,
        protein_fat_loss: Number(settings.protein_fat_loss),
        protein_maintain: Number(settings.protein_maintain),
        protein_muscle_gain: Number(settings.protein_muscle_gain),
        health_score_lifestyle_weight: settings.health_score_lifestyle_weight,
        health_score_physical_weight: settings.health_score_physical_weight,
        health_score_calorie_bonus: settings.health_score_calorie_bonus,
        health_score_calorie_min: settings.health_score_calorie_min,
        health_score_calorie_max: settings.health_score_calorie_max,
        metabolic_impact_cap: settings.metabolic_impact_cap,
        lifestyle_multiplier_enabled: settings.lifestyle_multiplier_enabled,
        lifestyle_multiplier_divisor: settings.lifestyle_multiplier_divisor,
        physical_score_base: settings.physical_score_base,
        physical_score_bmi_optimal: settings.physical_score_bmi_optimal,
        physical_score_bmi_acceptable: settings.physical_score_bmi_acceptable,
        physical_score_bmi_outside: settings.physical_score_bmi_outside,
        physical_score_bodyfat_optimal: settings.physical_score_bodyfat_optimal,
        physical_score_bodyfat_acceptable: settings.physical_score_bodyfat_acceptable,
        physical_score_bodyfat_outside: settings.physical_score_bodyfat_outside,
        bmi_optimal_min: Number(settings.bmi_optimal_min),
        bmi_optimal_max: Number(settings.bmi_optimal_max),
        bmi_acceptable_min: Number(settings.bmi_acceptable_min),
        bmi_acceptable_max: Number(settings.bmi_acceptable_max),
        bodyfat_male_optimal_min: settings.bodyfat_male_optimal_min,
        bodyfat_male_optimal_max: settings.bodyfat_male_optimal_max,
        bodyfat_male_acceptable_min: settings.bodyfat_male_acceptable_min,
        bodyfat_male_acceptable_max: settings.bodyfat_male_acceptable_max,
        bodyfat_female_optimal_min: settings.bodyfat_female_optimal_min,
        bodyfat_female_optimal_max: settings.bodyfat_female_optimal_max,
        bodyfat_female_acceptable_min: settings.bodyfat_female_acceptable_min,
        bodyfat_female_acceptable_max: settings.bodyfat_female_acceptable_max,
        health_score_tiers: settings.health_score_tiers,
      });
    }
  }, [settings, reset]);

  // Handle form submission
  const onSubmit = (data: CalculatorSettingsFormData) => {
    if (!settings?.id) return;

    setIsUpdating(true);
    updateSettings(
      {
        resource: "calculator_settings",
        id: settings.id,
        values: {
          ...data,
          goal_maintain_adjustment: 0, // Always 0
        },
      },
      {
        onSuccess: () => {
          setIsUpdating(false);
          settingsQuery.query.refetch();
        },
        onError: () => {
          setIsUpdating(false);
        },
      }
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="athletic-card p-6 pl-8">
          <div className="animate-pulse">
            <div className="h-10 w-64 bg-secondary mb-2" />
            <div className="h-4 w-96 bg-secondary" />
          </div>
        </div>
        <div className="athletic-card p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Error state
  if (fetchError) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="athletic-card p-6 pl-8">
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
            Calculator <span className="gradient-athletic">Settings</span>
          </h1>
          <p className="text-sm text-muted-foreground font-bold">
            Configure calculator formulas and parameters
          </p>
        </div>
        <div className="athletic-card p-6">
          <div className="flex items-center gap-3 text-red-500">
            <AlertCircle className="h-6 w-6" />
            <div>
              <h3 className="font-bold">Failed to load settings</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {fetchError instanceof Error ? fetchError.message : "Unknown error occurred"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              Calculator <span className="gradient-athletic">Settings</span>
            </h1>
            <p className="text-sm text-muted-foreground font-bold">
              Configure calculator formulas and parameters used in assessments
            </p>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="athletic-card p-6">
        <CalculatorSettingsForm
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
          isSubmitting={isUpdating}
          onSubmit={handleSubmit(onSubmit)}
        />
      </div>
    </div>
  );
}
