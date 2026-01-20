"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Lock, Check, Circle, ChevronRight, Target, Calculator } from "lucide-react";

interface ProfileIncompleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartAssessment: () => void;
  onStartCalculator: () => void;
  hasAssessment: boolean;
  hasCalculator: boolean;
}

export function ProfileIncompleteModal({
  open,
  onOpenChange,
  onStartAssessment,
  onStartCalculator,
  hasAssessment,
  hasCalculator,
}: ProfileIncompleteModalProps) {
  const handleStartAction = () => {
    onOpenChange(false);
    if (!hasAssessment) {
      onStartAssessment();
    } else if (!hasCalculator) {
      onStartCalculator();
    }
  };

  const getActionButtonText = () => {
    if (!hasAssessment) return "Start Assessment";
    if (!hasCalculator) return "Continue to Calculator";
    return "Open Challenge Hub";
  };

  const getActionButtonIcon = () => {
    if (!hasAssessment) return Target;
    return Calculator;
  };

  const ActionIcon = getActionButtonIcon();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-4 bg-card border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-secondary">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                Challenge Hub <span className="gradient-athletic">Locked</span>
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-muted-foreground font-bold text-sm mt-2">
            Complete your profile to unlock personalized challenge targets
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4 sm:p-6 space-y-6">
            {/* Info Section */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-1 gradient-electric" />
                <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                  Why Complete Your Profile?
                </h3>
              </div>

              <div className="athletic-card p-5 pl-8">
                <p className="text-sm text-muted-foreground font-bold leading-relaxed">
                  The 30-day challenge uses your assessment and calculator results to set
                  personalized protein targets. Without them, we can&apos;t customize your daily
                  goals for optimal metabolic results.
                </p>
              </div>
            </section>

            {/* Required Steps */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-1 gradient-electric" />
                <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                  Required Steps
                </h3>
              </div>

              <div className="space-y-3">
                {/* Step 1: Assessment */}
                <div
                  className={`athletic-card p-4 pl-6 flex items-center gap-3 ${
                    hasAssessment ? "bg-secondary/50" : ""
                  }`}
                >
                  <div className={`p-1.5 ${hasAssessment ? "bg-primary" : "bg-secondary"}`}>
                    {hasAssessment ? (
                      <Check className="h-4 w-4 text-black" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span
                        className={`font-black text-sm uppercase tracking-wide ${
                          hasAssessment ? "text-muted-foreground line-through" : ""
                        }`}
                      >
                        Complete Lifestyle Assessment
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {hasAssessment
                        ? "Completed"
                        : "Rate your current lifestyle across 7 key areas"}
                    </span>
                  </div>
                </div>

                {/* Step 2: Calculator */}
                <div
                  className={`athletic-card p-4 pl-6 flex items-center gap-3 ${
                    hasCalculator ? "bg-secondary/50" : ""
                  }`}
                >
                  <div className={`p-1.5 ${hasCalculator ? "bg-primary" : "bg-secondary"}`}>
                    {hasCalculator ? (
                      <Check className="h-4 w-4 text-black" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-primary" />
                      <span
                        className={`font-black text-sm uppercase tracking-wide ${
                          hasCalculator ? "text-muted-foreground line-through" : ""
                        }`}
                      >
                        Complete Metabolic Calculator
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {hasCalculator
                        ? "Completed"
                        : "Get your personalized BMR, TDEE, and protein target"}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-border space-y-3">
              <button
                onClick={handleStartAction}
                className="btn-athletic group w-full flex items-center justify-center gap-3 px-8 py-5 gradient-electric text-black glow-power"
              >
                <ActionIcon className="h-5 w-5" />
                {getActionButtonText()}
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => onOpenChange(false)}
                className="btn-athletic w-full px-6 py-4 bg-secondary text-foreground"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
