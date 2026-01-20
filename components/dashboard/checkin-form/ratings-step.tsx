"use client";

import { UseFormWatch, UseFormSetValue } from "react-hook-form";
import { Battery, Moon, Brain, Smile } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import type { CheckInFormData } from "@/lib/validations";

interface RatingsStepProps {
  watch: UseFormWatch<CheckInFormData>;
  setValue: UseFormSetValue<CheckInFormData>;
}

interface RatingSliderProps {
  icon: React.ElementType;
  label: string;
  lowLabel: string;
  highLabel: string;
  value: number;
  onChange: (value: number) => void;
}

function RatingSlider({
  icon: Icon,
  label,
  lowLabel,
  highLabel,
  value,
  onChange,
}: RatingSliderProps) {
  return (
    <div className="athletic-card p-6 pl-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-secondary">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <span className="text-xs font-black tracking-[0.15em] uppercase text-foreground">
          {label}
        </span>
        <span className="ml-auto text-2xl font-black gradient-athletic">{value}</span>
      </div>

      <div className="space-y-2">
        <Slider
          value={[value]}
          onValueChange={(values) => onChange(values[0])}
          min={1}
          max={10}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          <span>1 - {lowLabel}</span>
          <span>10 - {highLabel}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Step 3: Subjective Ratings
 * Four sliders for energy, sleep, stress, and mood (1-10 scale)
 */
export function RatingsStep({ watch, setValue }: RatingsStepProps) {
  const energyRating = watch("energy_rating") || 5;
  const sleepRating = watch("sleep_rating") || 5;
  const stressRating = watch("stress_rating") || 5;
  const moodRating = watch("mood_rating") || 5;

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-1 gradient-electric" />
        <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
          Step 3 of 4: How You&apos;re Feeling
        </h3>
      </div>

      {/* Rating Sliders */}
      <div className="space-y-4">
        <RatingSlider
          icon={Battery}
          label="Energy Levels"
          lowLabel="Exhausted"
          highLabel="Energized"
          value={energyRating}
          onChange={(val) => setValue("energy_rating", val)}
        />

        <RatingSlider
          icon={Moon}
          label="Sleep Quality"
          lowLabel="Terrible"
          highLabel="Excellent"
          value={sleepRating}
          onChange={(val) => setValue("sleep_rating", val)}
        />

        <RatingSlider
          icon={Brain}
          label="Stress Levels"
          lowLabel="Overwhelmed"
          highLabel="Calm"
          value={stressRating}
          onChange={(val) => setValue("stress_rating", val)}
        />

        <RatingSlider
          icon={Smile}
          label="Overall Mood"
          lowLabel="Low"
          highLabel="Great"
          value={moodRating}
          onChange={(val) => setValue("mood_rating", val)}
        />
      </div>

      {/* Summary */}
      <div className="p-4 bg-secondary/50 border border-border">
        <h4 className="text-xs font-black tracking-[0.15em] uppercase text-muted-foreground mb-3">
          Why This Matters
        </h4>
        <p className="text-sm font-bold text-muted-foreground">
          These ratings help your coach understand factors beyond the scale. Low energy, poor sleep,
          or high stress can affect your progress and may require adjustments to your program.
        </p>
      </div>
    </div>
  );
}
