"use client";

import { Utensils, Activity, Calendar, TrendingDown } from "lucide-react";

interface FatLossActionPlanProps {
  targetCalories: number;
  lifestyleScore: number;
  physicalScore: number;
  weightKg: number;
  goalWeightKg?: number;
  nutritionDeficit: number;
}

/**
 * Calculate movement deficit based on lifestyle and physical scores.
 * Range: 375 (score 0) to 600 (score 100)
 */
function calculateMovementDeficit(lifestyleScore: number, physicalScore: number): number {
  const avgScore = (lifestyleScore + physicalScore) / 2;
  return Math.round(375 + (avgScore / 100) * 225);
}

/**
 * Fat Loss Action Plan Component for the Results Modal.
 * Contains:
 * 1. Smart Nutrition + Strategic Movement cards
 * 2. Combined Weekly Result Banner
 * 3. Timeline to Goal Section (when goalWeight provided)
 * 4. Recommended Activities Section
 *
 * Only shown for fat_loss goal.
 */
export function FatLossActionPlan({
  targetCalories,
  lifestyleScore,
  physicalScore,
  weightKg,
  goalWeightKg,
  nutritionDeficit,
}: FatLossActionPlanProps) {
  const movementDeficit = calculateMovementDeficit(lifestyleScore, physicalScore);
  const totalDailyDeficit = nutritionDeficit + movementDeficit;
  const weeklyDeficit = totalDailyDeficit * 7;
  const weeklyFatLossKg = (weeklyDeficit / 7700).toFixed(1);

  // Timeline calculations
  const hasGoalWeight = goalWeightKg !== undefined && goalWeightKg < weightKg;
  const weightToLose = hasGoalWeight ? weightKg - goalWeightKg! : 0;
  const weeksToGoal = hasGoalWeight ? Math.ceil(weightToLose / parseFloat(weeklyFatLossKg)) : 0;

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-1 gradient-electric" />
        <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
          Your Fat Loss Strategy
        </h3>
      </div>

      {/* Smart Nutrition + Strategic Movement Cards */}
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        {/* Smart Nutrition Card */}
        <div className="athletic-card p-5 pl-8 border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-2 mb-3">
            <Utensils className="h-5 w-5 text-emerald-400" />
            <h4 className="font-black uppercase tracking-wide text-sm text-emerald-400">
              Smart Nutrition
            </h4>
          </div>
          <div className="text-3xl font-black text-emerald-400 mb-1">{nutritionDeficit}</div>
          <div className="text-xs text-muted-foreground font-bold mb-3">
            calories below maintenance
          </div>
          <div className="text-sm">
            <span className="font-black text-muted-foreground">Target:</span>{" "}
            <span className="font-bold">{targetCalories.toLocaleString()} cal/day</span>
          </div>
        </div>

        {/* Strategic Movement Card */}
        <div className="athletic-card p-5 pl-8 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-5 w-5 text-blue-400" />
            <h4 className="font-black uppercase tracking-wide text-sm text-blue-400">
              Strategic Movement
            </h4>
          </div>
          <div className="text-3xl font-black text-blue-400 mb-1">{movementDeficit}</div>
          <div className="text-xs text-muted-foreground font-bold mb-3">
            calories through activity
          </div>
          <div className="text-sm">
            <span className="font-black text-muted-foreground">Plan:</span>{" "}
            <span className="font-bold">4-5 workouts + daily movement</span>
          </div>
        </div>
      </div>

      {/* Combined Weekly Result Banner */}
      <div className="athletic-card p-6 pl-8 gradient-electric/10 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="h-5 w-5 text-primary" />
          <h4 className="font-black uppercase tracking-wide text-sm">Combined Weekly Result</h4>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-8">
          <div>
            <div className="text-5xl font-black gradient-athletic bg-clip-text text-transparent">
              {weeklyFatLossKg} kg
            </div>
            <div className="text-sm font-bold text-muted-foreground mt-1">
              potential fat loss per week
            </div>
          </div>

          <div className="text-xs text-muted-foreground font-bold leading-relaxed max-w-xs">
            <div className="mb-1">
              ({nutritionDeficit} + {movementDeficit}) × 7 = {weeklyDeficit.toLocaleString()}{" "}
              cal/week
            </div>
            <div>
              {weeklyDeficit.toLocaleString()} ÷ 7,700 cal/kg = {weeklyFatLossKg} kg
            </div>
          </div>
        </div>
      </div>

      {/* Timeline to Goal Section */}
      {hasGoalWeight && (
        <div className="athletic-card p-5 pl-8 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h4 className="font-black uppercase tracking-wide text-sm">Timeline to Goal</h4>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-secondary/30">
              <div className="text-xs font-black tracking-wider text-muted-foreground uppercase mb-1">
                Current
              </div>
              <div className="text-2xl font-black">{weightKg}</div>
              <div className="text-xs text-muted-foreground font-bold">kg</div>
            </div>

            <div className="text-center p-3 bg-secondary/30">
              <div className="text-xs font-black tracking-wider text-muted-foreground uppercase mb-1">
                Goal
              </div>
              <div className="text-2xl font-black text-primary">{goalWeightKg}</div>
              <div className="text-xs text-muted-foreground font-bold">kg</div>
            </div>

            <div className="text-center p-3 bg-secondary/30">
              <div className="text-xs font-black tracking-wider text-muted-foreground uppercase mb-1">
                To Lose
              </div>
              <div className="text-2xl font-black text-red-400">{weightToLose}</div>
              <div className="text-xs text-muted-foreground font-bold">kg</div>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/30 p-4 text-center">
            <div className="text-xs font-black tracking-wider text-muted-foreground uppercase mb-1">
              Estimated Timeline
            </div>
            <div className="text-3xl font-black text-primary">{weeksToGoal} weeks</div>
            <div className="text-xs text-muted-foreground font-bold mt-1">
              At ~{weeklyFatLossKg} kg sustainable fat loss per week
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
