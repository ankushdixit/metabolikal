"use client";

import { UseFormRegister, FieldErrors } from "react-hook-form";
import { Scale, Ruler, AlertCircle } from "lucide-react";
import type { CheckInFormData } from "@/lib/validations";

interface MeasurementsStepProps {
  register: UseFormRegister<CheckInFormData>;
  errors: FieldErrors<CheckInFormData>;
  currentDate: string;
}

/**
 * Converts input value to number, returning undefined for empty/invalid values
 * This prevents NaN from being passed to zod validation
 */
const parseOptionalNumber = (value: string) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const num = parseFloat(value);
  return isNaN(num) ? undefined : num;
};

const parseRequiredNumber = (value: string) => {
  if (value === "" || value === null || value === undefined) return NaN; // Let zod handle required validation
  const num = parseFloat(value);
  return num;
};

/**
 * Step 1: Measurements
 * Collects weight (required) and optional body measurements
 */
export function MeasurementsStep({ register, errors, currentDate }: MeasurementsStepProps) {
  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-1 gradient-electric" />
        <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
          Step 1 of 4: Measurements
        </h3>
      </div>

      {/* Date Display (read-only) */}
      <div>
        <label className="block text-xs font-black tracking-[0.2em] uppercase text-muted-foreground mb-2">
          Date
        </label>
        <div className="flex items-center gap-3 p-4 bg-secondary">
          <span className="text-foreground font-bold">{currentDate}</span>
        </div>
      </div>

      {/* Weight - Required */}
      <div>
        <label
          htmlFor="weight"
          className="block text-xs font-black tracking-[0.2em] uppercase text-muted-foreground mb-2"
        >
          Current Weight (kg) <span className="text-primary">*</span>
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-secondary">
            <Scale className="h-4 w-4 text-primary" />
          </div>
          <input
            id="weight"
            type="number"
            step="0.1"
            placeholder="75.5"
            className="w-full pl-14 pr-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
            {...register("weight", { setValueAs: parseRequiredNumber })}
          />
        </div>
        {errors.weight && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.weight.message}</span>
          </div>
        )}
      </div>

      {/* Body Fat % - Optional */}
      <div>
        <label
          htmlFor="body_fat_percent"
          className="block text-xs font-black tracking-[0.2em] uppercase text-muted-foreground mb-2"
        >
          Body Fat % (optional)
        </label>
        <input
          id="body_fat_percent"
          type="number"
          step="0.1"
          placeholder="15.0"
          className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          {...register("body_fat_percent", { setValueAs: parseOptionalNumber })}
        />
        {errors.body_fat_percent && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.body_fat_percent.message}</span>
          </div>
        )}
      </div>

      {/* Body Measurements Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-secondary">
            <Ruler className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground">
            Body Measurements (cm) - Optional
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Chest */}
          <div>
            <label
              htmlFor="chest_cm"
              className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2"
            >
              Chest
            </label>
            <input
              id="chest_cm"
              type="number"
              step="0.1"
              placeholder="100"
              className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              {...register("chest_cm", { setValueAs: parseOptionalNumber })}
            />
          </div>

          {/* Waist */}
          <div>
            <label
              htmlFor="waist_cm"
              className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2"
            >
              Waist
            </label>
            <input
              id="waist_cm"
              type="number"
              step="0.1"
              placeholder="80"
              className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              {...register("waist_cm", { setValueAs: parseOptionalNumber })}
            />
          </div>

          {/* Hips */}
          <div>
            <label
              htmlFor="hips_cm"
              className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2"
            >
              Hips
            </label>
            <input
              id="hips_cm"
              type="number"
              step="0.1"
              placeholder="95"
              className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              {...register("hips_cm", { setValueAs: parseOptionalNumber })}
            />
          </div>

          {/* Arms */}
          <div>
            <label
              htmlFor="arms_cm"
              className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2"
            >
              Arms
            </label>
            <input
              id="arms_cm"
              type="number"
              step="0.1"
              placeholder="35"
              className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              {...register("arms_cm", { setValueAs: parseOptionalNumber })}
            />
          </div>

          {/* Thighs */}
          <div>
            <label
              htmlFor="thighs_cm"
              className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2"
            >
              Thighs
            </label>
            <input
              id="thighs_cm"
              type="number"
              step="0.1"
              placeholder="55"
              className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              {...register("thighs_cm", { setValueAs: parseOptionalNumber })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
