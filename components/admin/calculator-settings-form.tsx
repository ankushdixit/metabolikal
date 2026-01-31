"use client";

import { useState } from "react";
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { AlertCircle, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { CalculatorSettingsFormData, HealthScoreTierFormData } from "@/lib/validations";

interface CalculatorSettingsFormProps {
  register: UseFormRegister<CalculatorSettingsFormData>;
  errors: FieldErrors<CalculatorSettingsFormData>;
  watch: UseFormWatch<CalculatorSettingsFormData>;
  setValue: UseFormSetValue<CalculatorSettingsFormData>;
  isSubmitting?: boolean;
  onSubmit: () => void;
}

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({
  title,
  description,
  children,
  defaultOpen = false,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/50 transition-colors"
      >
        <div className="text-left">
          <h3 className="text-sm font-black tracking-wider uppercase">{title}</h3>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      {isOpen && <div className="p-4 space-y-4 border-t border-border">{children}</div>}
    </div>
  );
}

interface NumberInputProps {
  id: string;
  label: string;
  description?: string;
  step?: string;
  min?: string;
  max?: string;
  register: UseFormRegister<CalculatorSettingsFormData>;
  fieldName: keyof CalculatorSettingsFormData;
  error?: string;
  suffix?: string;
}

function NumberInput({
  id,
  label,
  description,
  step = "1",
  min,
  max,
  register,
  fieldName,
  error,
  suffix,
}: NumberInputProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-1"
      >
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          step={step}
          min={min}
          max={max}
          className="flex-1 px-3 py-2 bg-card border border-border text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          {...register(fieldName, { valueAsNumber: true })}
        />
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground flex items-start gap-1">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          {description}
        </p>
      )}
      {error && (
        <div className="flex items-center gap-2 mt-1 text-red-500 text-xs font-bold">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Calculator Settings Form Component
 * Comprehensive form for admin-configurable calculator parameters
 */
export function CalculatorSettingsForm({
  register,
  errors,
  watch,
  setValue,
  isSubmitting = false,
  onSubmit,
}: CalculatorSettingsFormProps) {
  const lifestyleMultiplierEnabled = watch("lifestyle_multiplier_enabled");
  const healthScoreTiers = watch("health_score_tiers") || [];

  const updateTier = (
    index: number,
    field: keyof HealthScoreTierFormData,
    value: string | number
  ) => {
    const newTiers = [...healthScoreTiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setValue("health_score_tiers", newTiers);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Activity Multipliers */}
      <CollapsibleSection
        title="Activity Multipliers"
        description="TDEE multipliers for different activity levels"
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumberInput
            id="activity_sedentary"
            label="Sedentary"
            description="Little or no exercise"
            step="0.001"
            min="1.0"
            max="2.5"
            register={register}
            fieldName="activity_sedentary"
            error={errors.activity_sedentary?.message}
          />
          <NumberInput
            id="activity_lightly_active"
            label="Lightly Active"
            description="Light exercise 1-3 days/week"
            step="0.001"
            min="1.0"
            max="2.5"
            register={register}
            fieldName="activity_lightly_active"
            error={errors.activity_lightly_active?.message}
          />
          <NumberInput
            id="activity_moderately_active"
            label="Moderately Active"
            description="Moderate exercise 3-5 days/week"
            step="0.001"
            min="1.0"
            max="2.5"
            register={register}
            fieldName="activity_moderately_active"
            error={errors.activity_moderately_active?.message}
          />
          <NumberInput
            id="activity_very_active"
            label="Very Active"
            description="Hard exercise 6-7 days/week"
            step="0.001"
            min="1.0"
            max="2.5"
            register={register}
            fieldName="activity_very_active"
            error={errors.activity_very_active?.message}
          />
          <NumberInput
            id="activity_extremely_active"
            label="Extremely Active"
            description="Very hard exercise, physical job"
            step="0.001"
            min="1.0"
            max="2.5"
            register={register}
            fieldName="activity_extremely_active"
            error={errors.activity_extremely_active?.message}
          />
        </div>
      </CollapsibleSection>

      {/* Goal Adjustments */}
      <CollapsibleSection
        title="Goal Calorie Adjustments"
        description="Daily calorie adjustment relative to TDEE"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumberInput
            id="goal_fat_loss_adjustment"
            label="Fat Loss"
            description="Deficit for fat loss (negative)"
            step="25"
            min="-1500"
            max="0"
            register={register}
            fieldName="goal_fat_loss_adjustment"
            error={errors.goal_fat_loss_adjustment?.message}
            suffix="cal"
          />
          <div>
            <label className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-1">
              Maintain
            </label>
            <input
              type="number"
              disabled
              value={0}
              className="w-full px-3 py-2 bg-muted border border-border text-muted-foreground font-mono text-sm cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-muted-foreground flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              Always 0 (no adjustment)
            </p>
          </div>
          <NumberInput
            id="goal_muscle_gain_adjustment"
            label="Muscle Gain"
            description="Surplus for muscle gain (positive)"
            step="25"
            min="0"
            max="1500"
            register={register}
            fieldName="goal_muscle_gain_adjustment"
            error={errors.goal_muscle_gain_adjustment?.message}
            suffix="cal"
          />
        </div>
      </CollapsibleSection>

      {/* Protein Ratios */}
      <CollapsibleSection title="Protein Ratios" description="Grams of protein per kg body weight">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumberInput
            id="protein_fat_loss"
            label="Fat Loss"
            description="Higher protein preserves muscle"
            step="0.1"
            min="1.0"
            max="4.0"
            register={register}
            fieldName="protein_fat_loss"
            error={errors.protein_fat_loss?.message}
            suffix="g/kg"
          />
          <NumberInput
            id="protein_maintain"
            label="Maintain"
            description="Standard protein intake"
            step="0.1"
            min="1.0"
            max="4.0"
            register={register}
            fieldName="protein_maintain"
            error={errors.protein_maintain?.message}
            suffix="g/kg"
          />
          <NumberInput
            id="protein_muscle_gain"
            label="Muscle Gain"
            description="Supports muscle growth"
            step="0.1"
            min="1.0"
            max="4.0"
            register={register}
            fieldName="protein_muscle_gain"
            error={errors.protein_muscle_gain?.message}
            suffix="g/kg"
          />
        </div>
      </CollapsibleSection>

      {/* Metabolic Impact */}
      <CollapsibleSection title="Metabolic Impact" description="Medical condition impact settings">
        <div className="max-w-xs">
          <NumberInput
            id="metabolic_impact_cap"
            label="Impact Cap"
            description="Maximum combined metabolic impact from conditions"
            step="1"
            min="10"
            max="50"
            register={register}
            fieldName="metabolic_impact_cap"
            error={errors.metabolic_impact_cap?.message}
            suffix="%"
          />
        </div>
      </CollapsibleSection>

      {/* Lifestyle Multiplier */}
      <CollapsibleSection
        title="Lifestyle Multiplier"
        description="Apply lifestyle score as TDEE adjustment"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="lifestyle_multiplier_enabled"
              checked={lifestyleMultiplierEnabled}
              onCheckedChange={(checked) =>
                setValue("lifestyle_multiplier_enabled", checked === true)
              }
              className="h-5 w-5"
            />
            <label
              htmlFor="lifestyle_multiplier_enabled"
              className="text-sm font-bold cursor-pointer"
            >
              Enable Lifestyle Multiplier
            </label>
          </div>
          {lifestyleMultiplierEnabled && (
            <div className="max-w-xs">
              <NumberInput
                id="lifestyle_multiplier_divisor"
                label="Divisor"
                description="Formula: 1 + ((score - 50) / divisor). Score 80 with divisor 500 = 1.06 (+6%)"
                step="50"
                min="100"
                max="1000"
                register={register}
                fieldName="lifestyle_multiplier_divisor"
                error={errors.lifestyle_multiplier_divisor?.message}
              />
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Health Score Weights */}
      <CollapsibleSection
        title="Health Score Configuration"
        description="How health score is calculated (weights must sum to 100)"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumberInput
            id="health_score_lifestyle_weight"
            label="Lifestyle Weight"
            description="Weight of lifestyle score"
            step="5"
            min="0"
            max="100"
            register={register}
            fieldName="health_score_lifestyle_weight"
            error={errors.health_score_lifestyle_weight?.message}
            suffix="%"
          />
          <NumberInput
            id="health_score_physical_weight"
            label="Physical Weight"
            description="Weight of physical score"
            step="5"
            min="0"
            max="100"
            register={register}
            fieldName="health_score_physical_weight"
            error={errors.health_score_physical_weight?.message}
            suffix="%"
          />
          <NumberInput
            id="health_score_calorie_bonus"
            label="Calorie Bonus"
            description="Bonus points for reasonable calorie targets"
            step="1"
            min="0"
            max="20"
            register={register}
            fieldName="health_score_calorie_bonus"
            error={errors.health_score_calorie_bonus?.message}
            suffix="pts"
          />
          <NumberInput
            id="health_score_calorie_min"
            label="Calorie Range Min"
            description="Minimum for calorie bonus"
            step="100"
            min="800"
            max="2000"
            register={register}
            fieldName="health_score_calorie_min"
            error={errors.health_score_calorie_min?.message}
            suffix="cal"
          />
          <NumberInput
            id="health_score_calorie_max"
            label="Calorie Range Max"
            description="Maximum for calorie bonus"
            step="100"
            min="2000"
            max="6000"
            register={register}
            fieldName="health_score_calorie_max"
            error={errors.health_score_calorie_max?.message}
            suffix="cal"
          />
        </div>
      </CollapsibleSection>

      {/* Physical Score */}
      <CollapsibleSection
        title="Physical Score Configuration"
        description="How physical score is calculated from BMI and body fat"
      >
        <div className="space-y-6">
          <div className="max-w-xs">
            <NumberInput
              id="physical_score_base"
              label="Base Score"
              description="Starting score before BMI/body fat points"
              step="5"
              min="50"
              max="90"
              register={register}
              fieldName="physical_score_base"
              error={errors.physical_score_base?.message}
              suffix="pts"
            />
          </div>

          <div>
            <h4 className="text-xs font-bold tracking-wider uppercase text-muted-foreground mb-3">
              BMI Point Awards
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NumberInput
                id="physical_score_bmi_optimal"
                label="Optimal Range"
                step="1"
                min="0"
                max="25"
                register={register}
                fieldName="physical_score_bmi_optimal"
                error={errors.physical_score_bmi_optimal?.message}
                suffix="pts"
              />
              <NumberInput
                id="physical_score_bmi_acceptable"
                label="Acceptable Range"
                step="1"
                min="0"
                max="25"
                register={register}
                fieldName="physical_score_bmi_acceptable"
                error={errors.physical_score_bmi_acceptable?.message}
                suffix="pts"
              />
              <NumberInput
                id="physical_score_bmi_outside"
                label="Outside Range"
                step="1"
                min="0"
                max="25"
                register={register}
                fieldName="physical_score_bmi_outside"
                error={errors.physical_score_bmi_outside?.message}
                suffix="pts"
              />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold tracking-wider uppercase text-muted-foreground mb-3">
              Body Fat Point Awards
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NumberInput
                id="physical_score_bodyfat_optimal"
                label="Optimal Range"
                step="1"
                min="0"
                max="25"
                register={register}
                fieldName="physical_score_bodyfat_optimal"
                error={errors.physical_score_bodyfat_optimal?.message}
                suffix="pts"
              />
              <NumberInput
                id="physical_score_bodyfat_acceptable"
                label="Acceptable Range"
                step="1"
                min="0"
                max="25"
                register={register}
                fieldName="physical_score_bodyfat_acceptable"
                error={errors.physical_score_bodyfat_acceptable?.message}
                suffix="pts"
              />
              <NumberInput
                id="physical_score_bodyfat_outside"
                label="Outside Range"
                step="1"
                min="0"
                max="25"
                register={register}
                fieldName="physical_score_bodyfat_outside"
                error={errors.physical_score_bodyfat_outside?.message}
                suffix="pts"
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* BMI Ranges */}
      <CollapsibleSection
        title="BMI Range Definitions"
        description="Define optimal and acceptable BMI ranges"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-bold tracking-wider uppercase text-muted-foreground mb-3">
              Optimal Range
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <NumberInput
                id="bmi_optimal_min"
                label="Min"
                step="0.1"
                min="15"
                max="25"
                register={register}
                fieldName="bmi_optimal_min"
                error={errors.bmi_optimal_min?.message}
              />
              <NumberInput
                id="bmi_optimal_max"
                label="Max"
                step="0.1"
                min="20"
                max="30"
                register={register}
                fieldName="bmi_optimal_max"
                error={errors.bmi_optimal_max?.message}
              />
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold tracking-wider uppercase text-muted-foreground mb-3">
              Acceptable Range
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <NumberInput
                id="bmi_acceptable_min"
                label="Min"
                step="0.1"
                min="10"
                max="20"
                register={register}
                fieldName="bmi_acceptable_min"
                error={errors.bmi_acceptable_min?.message}
              />
              <NumberInput
                id="bmi_acceptable_max"
                label="Max"
                step="0.1"
                min="25"
                max="40"
                register={register}
                fieldName="bmi_acceptable_max"
                error={errors.bmi_acceptable_max?.message}
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Body Fat Ranges */}
      <CollapsibleSection
        title="Body Fat Range Definitions"
        description="Define optimal and acceptable body fat ranges by gender"
      >
        <div className="space-y-6">
          <div>
            <h4 className="text-xs font-bold tracking-wider uppercase text-muted-foreground mb-3">
              Male Body Fat Ranges (%)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <NumberInput
                id="bodyfat_male_optimal_min"
                label="Optimal Min"
                step="1"
                min="3"
                max="20"
                register={register}
                fieldName="bodyfat_male_optimal_min"
                error={errors.bodyfat_male_optimal_min?.message}
              />
              <NumberInput
                id="bodyfat_male_optimal_max"
                label="Optimal Max"
                step="1"
                min="10"
                max="30"
                register={register}
                fieldName="bodyfat_male_optimal_max"
                error={errors.bodyfat_male_optimal_max?.message}
              />
              <NumberInput
                id="bodyfat_male_acceptable_min"
                label="Acceptable Min"
                step="1"
                min="3"
                max="15"
                register={register}
                fieldName="bodyfat_male_acceptable_min"
                error={errors.bodyfat_male_acceptable_min?.message}
              />
              <NumberInput
                id="bodyfat_male_acceptable_max"
                label="Acceptable Max"
                step="1"
                min="15"
                max="35"
                register={register}
                fieldName="bodyfat_male_acceptable_max"
                error={errors.bodyfat_male_acceptable_max?.message}
              />
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold tracking-wider uppercase text-muted-foreground mb-3">
              Female Body Fat Ranges (%)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <NumberInput
                id="bodyfat_female_optimal_min"
                label="Optimal Min"
                step="1"
                min="10"
                max="25"
                register={register}
                fieldName="bodyfat_female_optimal_min"
                error={errors.bodyfat_female_optimal_min?.message}
              />
              <NumberInput
                id="bodyfat_female_optimal_max"
                label="Optimal Max"
                step="1"
                min="20"
                max="40"
                register={register}
                fieldName="bodyfat_female_optimal_max"
                error={errors.bodyfat_female_optimal_max?.message}
              />
              <NumberInput
                id="bodyfat_female_acceptable_min"
                label="Acceptable Min"
                step="1"
                min="8"
                max="20"
                register={register}
                fieldName="bodyfat_female_acceptable_min"
                error={errors.bodyfat_female_acceptable_min?.message}
              />
              <NumberInput
                id="bodyfat_female_acceptable_max"
                label="Acceptable Max"
                step="1"
                min="25"
                max="45"
                register={register}
                fieldName="bodyfat_female_acceptable_max"
                error={errors.bodyfat_female_acceptable_max?.message}
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Health Score Tiers */}
      <CollapsibleSection
        title="Health Score Tiers"
        description="Define the health score tier labels and ranges"
      >
        <div className="space-y-4">
          {healthScoreTiers.map((tier, index) => (
            <div key={index} className="p-4 border border-border rounded-lg bg-muted/30">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-1">
                    Tier Name
                  </label>
                  <input
                    type="text"
                    value={tier.name}
                    onChange={(e) => updateTier(index, "name", e.target.value)}
                    className="w-full px-3 py-2 bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-1">
                    Min Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={tier.minScore}
                    onChange={(e) => updateTier(index, "minScore", parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-card border border-border text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-1">
                    Max Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={tier.maxScore}
                    onChange={(e) => updateTier(index, "maxScore", parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-card border border-border text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="lg:col-span-4">
                  <label className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={tier.description}
                    onChange={(e) => updateTier(index, "description", e.target.value)}
                    className="w-full px-3 py-2 bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          ))}
          {errors.health_score_tiers && (
            <div className="flex items-center gap-2 text-red-500 text-sm font-bold">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.health_score_tiers.message || "Invalid tier configuration"}</span>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t border-border">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-athletic px-8 py-3 gradient-electric text-black glow-power disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
