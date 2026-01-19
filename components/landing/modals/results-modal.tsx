"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Flame,
  Activity,
  Target,
  Dumbbell,
  ChevronRight,
  Share2,
  Copy,
  Check,
  AlertTriangle,
  TrendingUp,
  Award,
} from "lucide-react";
import { CalculatorResults, Goal, GOAL_ADJUSTMENTS } from "@/hooks/use-calculator";
import { useState } from "react";

interface ResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: CalculatorResults | null;
  lifestyleScore: number;
  healthScore: number;
  goal: Goal;
  onBookCall: () => void;
}

/**
 * Get personalized insights based on health score.
 */
function getInsights(healthScore: number): {
  level: string;
  message: string;
  icon: typeof AlertTriangle;
} {
  if (healthScore < 50) {
    return {
      level: "urgent",
      message:
        "Your metabolic health needs urgent attention. A metabolic reset is strongly recommended to rebuild your foundation and reclaim your energy.",
      icon: AlertTriangle,
    };
  }
  if (healthScore <= 70) {
    return {
      level: "moderate",
      message:
        "There are clear optimization opportunities in your metabolic profile. Strategic adjustments can unlock significant performance gains.",
      icon: TrendingUp,
    };
  }
  return {
    level: "positive",
    message:
      "Your metabolic foundation is solid. Fine-tuning your approach can help you achieve elite-level performance and maintain long-term results.",
    icon: Award,
  };
}

export function ResultsModal({
  open,
  onOpenChange,
  results,
  lifestyleScore,
  healthScore,
  goal,
  onBookCall,
}: ResultsModalProps) {
  const [copied, setCopied] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  if (!results) return null;

  const insights = getInsights(healthScore);
  const InsightIcon = insights.icon;
  const goalLabel = GOAL_ADJUSTMENTS[goal].label;

  const handleShare = async () => {
    const shareText = `My METABOLI-K-AL Results:\n\nHealth Score: ${healthScore}/100\nLifestyle Score: ${lifestyleScore}/100\nBMR: ${results.bmr} cal\nTDEE: ${results.tdee} cal\nTarget: ${results.targetCalories} cal\n\nDiscover your metabolic potential at metabolikal.com`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My METABOLI-K-AL Results",
          text: shareText,
        });
      } catch {
        // User cancelled or share failed, show copy option
        setShowShareOptions(true);
      }
    } else {
      setShowShareOptions(true);
    }
  };

  const handleCopy = async () => {
    const shareText = `My METABOLI-K-AL Results:\n\nHealth Score: ${healthScore}/100\nLifestyle Score: ${lifestyleScore}/100\nBMR: ${results.bmr} cal\nTDEE: ${results.tdee} cal\nTarget: ${results.targetCalories} cal\n\nDiscover your metabolic potential at metabolikal.com`;

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  const handleBookCall = () => {
    onOpenChange(false);
    onBookCall();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card p-0">
        <DialogHeader className="p-6 pb-4 sticky top-0 bg-card z-10 border-b border-border">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">
            Your <span className="gradient-athletic">METABOLI-K-AL</span> Results
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-8">
          {/* Health Score Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-1 gradient-electric" />
              <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                Your Health Score
              </h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Metabolic Health Score */}
              <div className="athletic-card p-6 pl-10 text-center">
                <div className="text-6xl font-black gradient-athletic bg-clip-text text-transparent">
                  {healthScore}
                </div>
                <div className="text-xs font-black tracking-wider text-muted-foreground uppercase mt-2">
                  Metabolic Health Score
                </div>
                <div className="text-sm text-muted-foreground font-bold mt-1">out of 100</div>
              </div>

              {/* Lifestyle Score */}
              <div className="athletic-card p-6 pl-10 text-center">
                <div className="text-6xl font-black text-primary">{lifestyleScore}</div>
                <div className="text-xs font-black tracking-wider text-muted-foreground uppercase mt-2">
                  Lifestyle Score
                </div>
                <div className="text-sm text-muted-foreground font-bold mt-1">out of 100</div>
              </div>
            </div>
          </section>

          {/* Insights Section */}
          <section>
            <div
              className={`athletic-card p-6 pl-10 ${
                insights.level === "urgent"
                  ? "border-l-amber-500"
                  : insights.level === "moderate"
                    ? "border-l-blue-500"
                    : "border-l-green-500"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 ${
                    insights.level === "urgent"
                      ? "bg-amber-500/20"
                      : insights.level === "moderate"
                        ? "bg-blue-500/20"
                        : "bg-green-500/20"
                  }`}
                >
                  <InsightIcon
                    className={`h-6 w-6 ${
                      insights.level === "urgent"
                        ? "text-amber-500"
                        : insights.level === "moderate"
                          ? "text-blue-500"
                          : "text-green-500"
                    }`}
                  />
                </div>
                <div>
                  <h4 className="font-black uppercase tracking-wide mb-2">
                    {insights.level === "urgent"
                      ? "Metabolic Reset Recommended"
                      : insights.level === "moderate"
                        ? "Optimization Opportunity"
                        : "Strong Foundation"}
                  </h4>
                  <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                    {insights.message}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Metabolic Numbers Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-1 gradient-electric" />
              <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                Your Metabolic Numbers
              </h3>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* BMR */}
              <div className="athletic-card p-5 pl-8">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="h-5 w-5 text-primary" />
                  <span className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                    BMR
                  </span>
                </div>
                <div className="text-2xl font-black">{results.bmr.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground font-bold">calories/day</div>
              </div>

              {/* TDEE */}
              <div className="athletic-card p-5 pl-8">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-5 w-5 text-primary" />
                  <span className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                    TDEE
                  </span>
                </div>
                <div className="text-2xl font-black">{results.tdee.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground font-bold">calories/day</div>
              </div>

              {/* Target Calories */}
              <div className="athletic-card p-5 pl-8 gradient-electric/10">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                    Target ({goalLabel})
                  </span>
                </div>
                <div className="text-2xl font-black text-primary">
                  {results.targetCalories.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground font-bold">calories/day</div>
              </div>

              {/* Protein */}
              <div className="athletic-card p-5 pl-8">
                <div className="flex items-center gap-2 mb-3">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  <span className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                    Protein
                  </span>
                </div>
                <div className="text-2xl font-black">{results.proteinGrams}</div>
                <div className="text-xs text-muted-foreground font-bold">grams/day</div>
              </div>
            </div>

            {/* Metabolic Impact Note */}
            {results.metabolicImpactPercent > 0 && (
              <div className="mt-4 athletic-card p-4 pl-8 bg-secondary/30">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> Your TDEE has been adjusted by -
                  {results.metabolicImpactPercent}% based on your selected medical conditions. This
                  provides a more accurate baseline for your unique metabolic profile.
                </p>
              </div>
            )}
          </section>

          {/* Share Section */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-1 gradient-electric" />
              <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                Share Your Results
              </h3>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleShare}
                className="btn-athletic flex items-center gap-2 px-6 py-3 bg-secondary text-foreground"
              >
                <Share2 className="h-4 w-4" />
                Share Results
              </button>

              {showShareOptions && (
                <button
                  onClick={handleCopy}
                  className="btn-athletic flex items-center gap-2 px-6 py-3 bg-secondary text-foreground"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy to Clipboard
                    </>
                  )}
                </button>
              )}
            </div>
          </section>

          {/* CTA Section */}
          <div className="pt-4 border-t border-border">
            <button
              onClick={handleBookCall}
              className="btn-athletic group w-full flex items-center justify-center gap-3 px-8 py-5 gradient-electric text-black glow-power"
            >
              Book Metabolic Breakthrough Call
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Get personalized guidance to optimize your metabolic health and achieve your
              transformation goals.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
