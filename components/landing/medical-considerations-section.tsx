"use client";

import { Heart, AlertTriangle, ArrowRight } from "lucide-react";

/**
 * Display interface for a medical condition with its impact
 */
export interface MedicalConditionDisplay {
  name: string;
  slug: string;
  impactPercent: number;
}

interface MedicalConsiderationsSectionProps {
  conditions: MedicalConditionDisplay[];
  baseBmr: number;
  adjustedBmr: number;
  totalImpactPercent: number;
}

/**
 * Medical Considerations Section for the Results Modal.
 * Shows breakdown of medical conditions affecting BMR, base vs adjusted comparison,
 * and a disclaimer about working with healthcare providers.
 *
 * Only renders when there are conditions with actual metabolic impact.
 */
export function MedicalConsiderationsSection({
  conditions,
  baseBmr,
  adjustedBmr,
  totalImpactPercent,
}: MedicalConsiderationsSectionProps) {
  // Don't render if no conditions or no impact
  if (conditions.length === 0 || totalImpactPercent <= 0) {
    return null;
  }

  const dailyCalorieReduction = Math.round(baseBmr - adjustedBmr);

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-1 gradient-electric" />
        <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
          Medical Considerations
        </h3>
      </div>

      <div className="athletic-card p-5 pl-8 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/20">
            <Heart className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h4 className="font-black uppercase tracking-wide text-sm">
              BMR Adjusted for Your Conditions
            </h4>
            <p className="text-xs text-muted-foreground font-bold mt-1">
              Your BMR has been personalized based on the following:
            </p>
          </div>
        </div>

        {/* Conditions List */}
        <div className="space-y-2">
          {conditions.map((condition) => (
            <div
              key={condition.slug}
              className="flex items-center justify-between py-2 px-3 bg-secondary/30"
            >
              <span className="font-bold text-sm">{condition.name}</span>
              <span className="text-red-400 font-black text-sm">-{condition.impactPercent}%</span>
            </div>
          ))}
        </div>

        {/* BMR Comparison */}
        <div className="grid grid-cols-3 gap-3 items-center py-4 border-y border-border">
          <div className="text-center">
            <div className="text-xs font-black tracking-wider text-muted-foreground uppercase mb-1">
              Base BMR
            </div>
            <div className="text-xl font-black">{baseBmr.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground font-bold">cal/day</div>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-primary" />
          </div>

          <div className="text-center">
            <div className="text-xs font-black tracking-wider text-muted-foreground uppercase mb-1">
              Your BMR
            </div>
            <div className="text-xl font-black text-primary">{adjustedBmr.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground font-bold">cal/day</div>
          </div>
        </div>

        {/* Total Impact Summary */}
        <div className="bg-red-950/30 border border-red-800/30 p-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground font-bold">Total Impact:</span>
            <span className="font-black text-red-400">
              Your conditions reduce BMR by ~{dailyCalorieReduction.toLocaleString()} cal/day
            </span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 p-4 bg-amber-950/30 border border-amber-800/30">
          <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground font-bold leading-relaxed">
            This adjustment provides a more accurate baseline for your unique metabolic profile.
            Continue working with your healthcare provider for personalized medical guidance.
          </p>
        </div>
      </div>
    </section>
  );
}
