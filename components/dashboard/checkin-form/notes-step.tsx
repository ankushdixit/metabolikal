"use client";

import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from "react-hook-form";
import { Utensils, Dumbbell, MessageSquare, Target, HelpCircle, FileText } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import type { CheckInFormData } from "@/lib/validations";

interface NotesStepProps {
  register: UseFormRegister<CheckInFormData>;
  watch: UseFormWatch<CheckInFormData>;
  setValue: UseFormSetValue<CheckInFormData>;
  errors: FieldErrors<CheckInFormData>;
}

/**
 * Step 4: Compliance & Notes
 * Adherence percentages and free-form text notes
 */
export function NotesStep({ register, watch, setValue, errors }: NotesStepProps) {
  const dietAdherence = watch("diet_adherence") || 80;
  const workoutAdherence = watch("workout_adherence") || 80;

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-1 gradient-electric" />
        <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
          Step 4 of 4: Compliance & Notes
        </h3>
      </div>

      {/* Adherence Sliders */}
      <div className="space-y-4">
        {/* Diet Adherence */}
        <div className="athletic-card p-6 pl-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-secondary">
              <Utensils className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs font-black tracking-[0.15em] uppercase text-foreground">
              Diet Adherence
            </span>
            <span className="ml-auto text-2xl font-black gradient-athletic">{dietAdherence}%</span>
          </div>

          <div className="space-y-2">
            <Slider
              value={[dietAdherence]}
              onValueChange={(values) => setValue("diet_adherence", values[0])}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Workout Adherence */}
        <div className="athletic-card p-6 pl-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-secondary">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs font-black tracking-[0.15em] uppercase text-foreground">
              Workout Adherence
            </span>
            <span className="ml-auto text-2xl font-black gradient-athletic">
              {workoutAdherence}%
            </span>
          </div>

          <div className="space-y-2">
            <Slider
              value={[workoutAdherence]}
              onValueChange={(values) => setValue("workout_adherence", values[0])}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Text Areas */}
      <div className="space-y-4">
        {/* Challenges Faced */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-secondary">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <label
              htmlFor="challenges"
              className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground"
            >
              Challenges Faced (optional)
            </label>
          </div>
          <textarea
            id="challenges"
            rows={3}
            placeholder="What obstacles did you encounter this week?"
            className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            {...register("challenges")}
          />
          {errors.challenges && (
            <p className="text-red-500 text-xs font-bold mt-1">{errors.challenges.message}</p>
          )}
        </div>

        {/* Progress Toward Goals */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-secondary">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <label
              htmlFor="progress_notes"
              className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground"
            >
              Progress Toward Goals (optional)
            </label>
          </div>
          <textarea
            id="progress_notes"
            rows={3}
            placeholder="Any wins or progress you want to highlight?"
            className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            {...register("progress_notes")}
          />
          {errors.progress_notes && (
            <p className="text-red-500 text-xs font-bold mt-1">{errors.progress_notes.message}</p>
          )}
        </div>

        {/* Questions for Coach */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-secondary">
              <HelpCircle className="h-4 w-4 text-primary" />
            </div>
            <label
              htmlFor="questions"
              className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground"
            >
              Questions for Coach (optional)
            </label>
          </div>
          <textarea
            id="questions"
            rows={3}
            placeholder="Anything you want to ask or discuss?"
            className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            {...register("questions")}
          />
          {errors.questions && (
            <p className="text-red-500 text-xs font-bold mt-1">{errors.questions.message}</p>
          )}
        </div>
      </div>

      {/* Encouragement Note */}
      <div className="p-4 bg-primary/10 border border-primary/30">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/20 flex-shrink-0">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-tight text-primary mb-1">
              Almost Done!
            </h4>
            <p className="text-sm font-bold text-muted-foreground">
              Review your entries and click &quot;Submit Check-In&quot; to complete. Your coach will
              review this within 24-48 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
