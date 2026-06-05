"use client";

import { useEffect, useState } from "react";
import { UseFormRegister, UseFormSetValue, FieldErrors } from "react-hook-form";
import { Scale, Ruler, AlertCircle } from "lucide-react";
import type { CheckInFormData } from "@/lib/validations";

interface MeasurementsStepProps {
  register: UseFormRegister<CheckInFormData>;
  setValue: UseFormSetValue<CheckInFormData>;
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

/** Length unit the client is entering body measurements in. Storage is always cm. */
type LengthUnit = "cm" | "in";

const CM_PER_INCH = 2.54;

/**
 * Body measurement fields, in display order. Placeholders are unit-specific so the
 * example value reads naturally whether the client is entering cm or inches.
 */
const MEASUREMENT_FIELDS = [
  { field: "neck_cm", label: "Neck", placeholderCm: "38", placeholderIn: "15" },
  { field: "chest_cm", label: "Chest", placeholderCm: "100", placeholderIn: "40" },
  { field: "waist_cm", label: "Waist", placeholderCm: "80", placeholderIn: "32" },
  { field: "hips_cm", label: "Hips", placeholderCm: "95", placeholderIn: "37" },
  { field: "arms_cm", label: "Arms", placeholderCm: "35", placeholderIn: "14" },
  { field: "thighs_cm", label: "Thighs", placeholderCm: "55", placeholderIn: "22" },
  { field: "calves_cm", label: "Calves", placeholderCm: "40", placeholderIn: "16" },
] as const;

type MeasurementField = (typeof MEASUREMENT_FIELDS)[number]["field"];

/**
 * Step 1: Measurements
 * Collects weight (required, always kg) and optional body measurements. Body
 * measurements can be entered in cm or inches via a unit toggle — whatever the
 * client picks, the value is converted to and stored as cm so the database and
 * all downstream calculations stay in a single canonical unit.
 */
export function MeasurementsStep({
  register,
  setValue,
  errors,
  currentDate,
}: MeasurementsStepProps) {
  const [unit, setUnit] = useState<LengthUnit>("cm");
  // Display strings keyed by field — what the client sees, in the selected unit.
  const [displayValues, setDisplayValues] = useState<Record<string, string>>({});

  // Register the measurement fields so RHF tracks them and surfaces validation
  // errors; their values are written via setValue (always in cm), not the input ref.
  useEffect(() => {
    MEASUREMENT_FIELDS.forEach(({ field }) => register(field));
  }, [register]);

  // Store the canonical cm value for a field given the raw display text + current unit.
  const commitCm = (field: MeasurementField, display: string, activeUnit: LengthUnit) => {
    const num = parseOptionalNumber(display);
    if (num === undefined) {
      setValue(field, undefined, { shouldValidate: false });
      return;
    }
    const cm = activeUnit === "in" ? num * CM_PER_INCH : num;
    setValue(field, cm, { shouldValidate: false });
  };

  const handleMeasurementChange = (field: MeasurementField, raw: string) => {
    setDisplayValues((prev) => ({ ...prev, [field]: raw }));
    commitCm(field, raw, unit);
  };

  // Switching units converts the displayed numbers to the new unit. The stored cm
  // values represent the same physical measurement and so are left untouched.
  const handleUnitChange = (next: LengthUnit) => {
    if (next === unit) return;
    setDisplayValues((prev) => {
      const converted = { ...prev };
      MEASUREMENT_FIELDS.forEach(({ field }) => {
        const num = parseOptionalNumber(prev[field] ?? "");
        if (num === undefined) return;
        converted[field] =
          next === "in" ? (num / CM_PER_INCH).toFixed(1) : (num * CM_PER_INCH).toFixed(1);
      });
      return converted;
    });
    setUnit(next);
  };

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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary">
              <Ruler className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground">
              Body Measurements ({unit}) - Optional
            </span>
          </div>

          {/* Unit toggle (cm / in) */}
          <div
            role="group"
            aria-label="Measurement unit"
            className="flex items-center bg-secondary p-1"
          >
            {(["cm", "in"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={unit === option}
                onClick={() => handleUnitChange(option)}
                className={`px-3 py-1 text-xs font-black uppercase tracking-wider transition-colors ${
                  unit === option
                    ? "gradient-electric text-black"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {MEASUREMENT_FIELDS.map(({ field, label, placeholderCm, placeholderIn }) => (
            <div key={field}>
              <label
                htmlFor={field}
                className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2"
              >
                {label}
              </label>
              <input
                id={field}
                type="number"
                step="0.1"
                inputMode="decimal"
                placeholder={unit === "in" ? placeholderIn : placeholderCm}
                value={displayValues[field] ?? ""}
                onChange={(e) => handleMeasurementChange(field, e.target.value)}
                className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors[field] && (
                <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors[field]?.message}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
