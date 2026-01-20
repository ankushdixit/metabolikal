"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import {
  Bed,
  Heart,
  Utensils,
  Brain,
  ShieldHalf,
  Users,
  Droplet,
  ChevronRight,
} from "lucide-react";
import {
  ASSESSMENT_CATEGORIES,
  AssessmentScores,
  AssessmentCategoryId,
} from "@/hooks/use-assessment";

interface AssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scores: AssessmentScores;
  onScoreChange: (category: AssessmentCategoryId, value: number) => void;
  onContinue: () => void;
}

const ICON_MAP = {
  Bed,
  Heart,
  Utensils,
  Brain,
  ShieldHeart: ShieldHalf,
  Users,
  Droplet,
};

export function AssessmentModal({
  open,
  onOpenChange,
  scores,
  onScoreChange,
  onContinue,
}: AssessmentModalProps) {
  const handleContinue = () => {
    onOpenChange(false);
    onContinue();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-card p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-4 bg-card border-b border-border flex-shrink-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">
            <span className="gradient-athletic">METABOLI-K-AL</span> Assessment
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm mt-2">
            Rate each area of your lifestyle from 0-10. Be honest — this assessment reveals where
            your metabolic optimization opportunities lie.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
            {/* Assessment Sliders */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-1 gradient-electric" />
                <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                  Lifestyle Assessment
                </h3>
              </div>

              <div className="space-y-6">
                {ASSESSMENT_CATEGORIES.map((category) => {
                  const Icon = ICON_MAP[category.icon as keyof typeof ICON_MAP];
                  const value = scores[category.id];

                  return (
                    <div key={category.id} className="athletic-card p-5 pl-8">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-secondary">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-black uppercase tracking-wide text-sm">
                            {category.label}
                          </h4>
                        </div>
                        <div className="text-2xl font-black text-primary">{value}</div>
                      </div>

                      <Slider
                        value={[value]}
                        onValueChange={([newValue]) => onScoreChange(category.id, newValue)}
                        min={0}
                        max={10}
                        step={1}
                        className="mb-3"
                      />

                      <div className="flex justify-between text-xs font-bold text-muted-foreground">
                        <span className="max-w-[45%]">{category.lowLabel}</span>
                        <span className="max-w-[45%] text-right">{category.highLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-border space-y-3">
              <button
                onClick={handleContinue}
                className="btn-athletic group w-full flex items-center justify-center gap-3 px-8 py-5 gradient-electric text-black glow-power"
              >
                Continue to Calculator
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => onOpenChange(false)}
                className="btn-athletic w-full px-6 py-4 bg-secondary text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
