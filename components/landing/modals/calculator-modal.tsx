"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, HelpCircle, AlertCircle } from "lucide-react";
import { calculatorFormSchema, CalculatorFormData } from "@/lib/validations";
import {
  ACTIVITY_MULTIPLIERS,
  GOAL_ADJUSTMENTS,
  MEDICAL_CONDITIONS,
  Gender,
  ActivityLevel,
  Goal,
  MedicalConditionId,
  calculateMetabolicImpact,
} from "@/hooks/use-calculator";
import { useState, useEffect } from "react";

interface CalculatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCalculate: (data: CalculatorFormData) => void;
  onOpenBodyFatGuide: () => void;
}

export function CalculatorModal({
  open,
  onOpenChange,
  onCalculate,
  onOpenBodyFatGuide,
}: CalculatorModalProps) {
  const [selectedConditions, setSelectedConditions] = useState<MedicalConditionId[]>([]);
  const [metabolicImpact, setMetabolicImpact] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CalculatorFormData>({
    resolver: zodResolver(calculatorFormSchema),
    defaultValues: {
      gender: "male",
      age: undefined,
      weightKg: undefined,
      heightCm: undefined,
      bodyFatPercent: undefined,
      activityLevel: "moderately_active",
      goal: "fat_loss",
      goalWeightKg: undefined,
      medicalConditions: [],
    },
  });

  const watchedGender = watch("gender");

  // Update metabolic impact when conditions change
  useEffect(() => {
    const impact = calculateMetabolicImpact(selectedConditions);
    setMetabolicImpact(impact);
    setValue("medicalConditions", selectedConditions);
  }, [selectedConditions, setValue]);

  const handleConditionToggle = (conditionId: MedicalConditionId) => {
    setSelectedConditions((prev) => {
      // If selecting "none", clear all other selections
      if (conditionId === "none") {
        return prev.includes("none") ? [] : ["none"];
      }

      // If selecting a condition, remove "none" and toggle the condition
      const withoutNone = prev.filter((c) => c !== "none");
      if (withoutNone.includes(conditionId)) {
        return withoutNone.filter((c) => c !== conditionId);
      }
      return [...withoutNone, conditionId];
    });
  };

  const onSubmit = (data: CalculatorFormData) => {
    onOpenChange(false);
    onCalculate(data);
  };

  const handleViewGuide = () => {
    onOpenChange(false);
    onOpenBodyFatGuide();
  };

  // Filter conditions based on gender
  const visibleConditions = MEDICAL_CONDITIONS.filter(
    (c) => c.genderRestriction === null || c.genderRestriction === watchedGender
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] bg-card p-0 flex flex-col">
        <DialogHeader className="p-4 sm:p-6 pb-4 bg-card border-b border-border flex-shrink-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">
            Metabolic <span className="gradient-athletic">Calculator</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm mt-2">
            Enter your metrics to calculate your personalized BMR, TDEE, and target calories.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-6 sm:space-y-8">
            {/* Basic Metrics Section */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-1 gradient-electric" />
                <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                  Your Metrics
                </h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Gender */}
                <div className="space-y-2">
                  <Label className="text-xs font-black tracking-wider uppercase text-muted-foreground">
                    Gender
                  </Label>
                  <Select
                    value={watch("gender")}
                    onValueChange={(value) => setValue("gender", value as Gender)}
                  >
                    <SelectTrigger className="athletic-card h-12">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.gender.message}
                    </p>
                  )}
                </div>

                {/* Age */}
                <div className="space-y-2">
                  <Label className="text-xs font-black tracking-wider uppercase text-muted-foreground">
                    Age
                  </Label>
                  <Input
                    type="number"
                    placeholder="Enter age"
                    className="athletic-card h-12"
                    {...register("age", { valueAsNumber: true })}
                  />
                  {errors.age && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.age.message}
                    </p>
                  )}
                </div>

                {/* Weight */}
                <div className="space-y-2">
                  <Label className="text-xs font-black tracking-wider uppercase text-muted-foreground">
                    Current Weight (kg)
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Enter weight"
                    className="athletic-card h-12"
                    {...register("weightKg", { valueAsNumber: true })}
                  />
                  {errors.weightKg && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.weightKg.message}
                    </p>
                  )}
                </div>

                {/* Height */}
                <div className="space-y-2">
                  <Label className="text-xs font-black tracking-wider uppercase text-muted-foreground">
                    Height (cm)
                  </Label>
                  <Input
                    type="number"
                    placeholder="Enter height"
                    className="athletic-card h-12"
                    {...register("heightCm", { valueAsNumber: true })}
                  />
                  {errors.heightCm && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.heightCm.message}
                    </p>
                  )}
                </div>

                {/* Body Fat (Optional) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-black tracking-wider uppercase text-muted-foreground">
                      Body Fat % (Optional)
                    </Label>
                    <button
                      type="button"
                      onClick={handleViewGuide}
                      className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                    >
                      <HelpCircle className="h-3 w-3" />
                      View guide
                    </button>
                  </div>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Enter body fat %"
                    className="athletic-card h-12"
                    {...register("bodyFatPercent", { valueAsNumber: true })}
                  />
                  {errors.bodyFatPercent && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.bodyFatPercent.message}
                    </p>
                  )}
                </div>

                {/* Goal Weight */}
                <div className="space-y-2">
                  <Label className="text-xs font-black tracking-wider uppercase text-muted-foreground">
                    Goal Weight (kg)
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Enter goal weight"
                    className="athletic-card h-12"
                    {...register("goalWeightKg", { valueAsNumber: true })}
                  />
                  {errors.goalWeightKg && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.goalWeightKg.message}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Activity & Goal Section */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-1 gradient-electric" />
                <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                  Activity & Goals
                </h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Activity Level */}
                <div className="space-y-2">
                  <Label className="text-xs font-black tracking-wider uppercase text-muted-foreground">
                    Activity Level
                  </Label>
                  <Select
                    value={watch("activityLevel")}
                    onValueChange={(value) => setValue("activityLevel", value as ActivityLevel)}
                  >
                    <SelectTrigger className="athletic-card h-12">
                      <SelectValue placeholder="Select activity level" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ACTIVITY_MULTIPLIERS).map(([key, { label, multiplier }]) => (
                        <SelectItem key={key} value={key}>
                          {label} ({multiplier}x)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.activityLevel && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.activityLevel.message}
                    </p>
                  )}
                </div>

                {/* Goal */}
                <div className="space-y-2">
                  <Label className="text-xs font-black tracking-wider uppercase text-muted-foreground">
                    Your Goal
                  </Label>
                  <Select
                    value={watch("goal")}
                    onValueChange={(value) => setValue("goal", value as Goal)}
                  >
                    <SelectTrigger className="athletic-card h-12">
                      <SelectValue placeholder="Select your goal" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(GOAL_ADJUSTMENTS).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.goal && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.goal.message}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Medical Conditions Section */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-1 gradient-electric" />
                <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                  Medical Conditions
                </h3>
              </div>
              <p className="text-muted-foreground font-bold text-sm mb-4">
                Select any conditions that apply. This helps us adjust your metabolic calculations
                for more accurate results.
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                {visibleConditions.map((condition) => (
                  <div
                    key={condition.id}
                    className="athletic-card p-4 pl-6 flex items-center gap-3 cursor-pointer hover:glow-power transition-all"
                    onClick={() => handleConditionToggle(condition.id)}
                  >
                    <Checkbox
                      id={condition.id}
                      checked={selectedConditions.includes(condition.id)}
                      onCheckedChange={() => handleConditionToggle(condition.id)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={condition.id} className="font-bold text-sm cursor-pointer">
                        {condition.label}
                      </Label>
                      {condition.impact > 0 && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (-{condition.impact}%)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Metabolic Impact Display */}
              <div className="mt-4 athletic-card p-4 pl-8 bg-secondary/50">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black tracking-wider uppercase text-muted-foreground">
                    Estimated Metabolic Impact
                  </span>
                  <span
                    className={`text-xl font-black ${metabolicImpact > 0 ? "text-amber-500" : "text-primary"}`}
                  >
                    -{metabolicImpact}%
                  </span>
                </div>
              </div>
            </section>

            {/* Privacy Notice */}
            <div className="athletic-card p-4 pl-8 bg-secondary/30">
              <p className="text-xs text-muted-foreground">
                <strong>Privacy:</strong> Your data is used solely to calculate your personalized
                metabolic results. We do not share your health information with third parties.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Disclaimer:</strong> These calculations are estimates based on standard
                formulas. Consult a healthcare professional for personalized medical advice.
              </p>
            </div>

            {/* Action Button */}
            <div className="pt-4 border-t border-border">
              <button
                type="submit"
                className="btn-athletic group w-full flex items-center justify-center gap-3 px-8 py-5 gradient-electric text-black glow-power"
              >
                Calculate Results
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
