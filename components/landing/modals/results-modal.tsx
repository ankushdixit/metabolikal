"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Flame,
  Activity,
  Target,
  Dumbbell,
  ChevronRight,
  Share2,
  Copy,
  Check,
  TrendingUp,
  Star,
  Moon,
  Heart,
  Utensils,
  Brain,
  Shield,
  Users,
  Droplet,
  Zap,
  Download,
  Loader2,
} from "lucide-react";
import { CalculatorResults, Goal } from "@/hooks/use-calculator";
import { AssessmentScores } from "@/hooks/use-assessment";
import { useState, useRef, useCallback } from "react";
import { StoredAssessment, calculateScoreComparison } from "@/hooks/use-assessment-storage";
import {
  getHealthScoreTier,
  getActionPlanStrategy,
  generatePriorityRecommendations,
  calculateLifestyleBoost,
  PriorityRecommendation,
} from "@/lib/results-insights";
import { ShareableResultsImage } from "../shareable-results-image";
import { HealthScoreChart } from "../health-score-chart";
import {
  MedicalConsiderationsSection,
  MedicalConditionDisplay,
} from "../medical-considerations-section";
import { FatLossActionPlan } from "../fat-loss-action-plan";
import type { CalculatorSettingsRow } from "@/lib/database.types";

interface ResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: CalculatorResults | null;
  lifestyleScore: number;
  healthScore: number;
  /**
   * Physical score calculated from BMI and body fat (0-100).
   * This is NOT the same as metabolic impact.
   */
  physicalScore: number;
  goal: Goal;
  onBookCall: () => void;
  previousAssessment?: StoredAssessment | null;
  assessmentScores?: AssessmentScores;

  // NEW: For Medical Considerations section
  medicalConditions?: MedicalConditionDisplay[];
  baseBmr?: number;
  adjustedBmr?: number;

  // NEW: For Timeline to Goal
  weightKg?: number;
  goalWeightKg?: number;

  // NEW: Calculator settings for fat loss deficit
  calculatorSettings?: CalculatorSettingsRow;
}

/**
 * Icon component mapping for priority recommendations
 */
const ICON_MAP: Record<string, typeof Moon> = {
  Moon,
  Heart,
  Utensils,
  Brain,
  Shield,
  Users,
  Droplet,
};

/**
 * Get the appropriate icon component for a recommendation
 */
function getRecommendationIcon(iconName: string) {
  return ICON_MAP[iconName] || Star;
}

export function ResultsModal({
  open,
  onOpenChange,
  results,
  lifestyleScore,
  healthScore,
  physicalScore,
  goal,
  onBookCall,
  previousAssessment,
  assessmentScores,
  medicalConditions,
  baseBmr,
  adjustedBmr,
  weightKg,
  goalWeightKg,
  calculatorSettings,
}: ResultsModalProps) {
  const [copied, setCopied] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const shareImageRef = useRef<HTMLDivElement>(null);

  // Generate shareable image and trigger download/share
  // IMPORTANT: This hook must be called before any early returns
  const generateShareableImage = useCallback(async (): Promise<Blob | null> => {
    if (!shareImageRef.current) return null;

    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(shareImageRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#0a0a0a",
      });

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      return await response.blob();
    } catch (error) {
      console.error("Error generating image:", error);
      return null;
    }
  }, []);

  // Early return AFTER all hooks are called
  if (!results) return null;

  // Get health score tier (status label and description)
  const healthTier = getHealthScoreTier(healthScore);

  // Calculate score comparison if previous assessment exists
  const scoreComparison = previousAssessment
    ? calculateScoreComparison(healthScore, previousAssessment.totalScore)
    : null;

  // Calculate lifestyle boost
  const lifestyleBoost = calculateLifestyleBoost(results.bmr, results.tdee);

  // Physical score is now passed as a prop (calculated from BMI + body fat)
  // No longer calculated from metabolic impact

  // Get action plan strategy
  const actionPlan = getActionPlanStrategy(goal, results.targetCalories);

  // Generate priority recommendations (only if assessment scores are available)
  const priorityRecommendations = assessmentScores
    ? generatePriorityRecommendations(assessmentScores, 3)
    : [];

  // Check if we should show medical considerations
  const showMedicalConsiderations =
    medicalConditions &&
    medicalConditions.length > 0 &&
    baseBmr !== undefined &&
    results.metabolicImpactPercent > 0;

  // Check if we should show fat loss action plan
  const isFatLossGoal = goal === "fat_loss";

  // Get nutrition deficit from settings (default 550)
  const nutritionDeficit = calculatorSettings?.goal_fat_loss_adjustment
    ? Math.abs(calculatorSettings.goal_fat_loss_adjustment)
    : 550;

  const handleDownloadImage = async () => {
    setIsGeneratingImage(true);
    try {
      const blob = await generateShareableImage();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `metabolikal-results-${healthScore}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleShare = async () => {
    setIsGeneratingImage(true);
    try {
      const blob = await generateShareableImage();

      if (
        blob &&
        navigator.share &&
        navigator.canShare?.({ files: [new File([blob], "results.png", { type: "image/png" })] })
      ) {
        // Share with image if supported
        const file = new File([blob], "metabolikal-results.png", { type: "image/png" });
        await navigator.share({
          title: "My METABOLI-K-AL Results",
          text: `Check out my METABOLI-K-AL Health Score: ${healthScore}/100! Discover your metabolic potential at metabolikal.com`,
          files: [file],
        });
      } else if (navigator.share) {
        // Fallback to text-only share
        await navigator.share({
          title: "My METABOLI-K-AL Results",
          text: `My METABOLI-K-AL Results:\n\nHealth Score: ${healthScore}/100\nLifestyle Score: ${lifestyleScore}/100\nBMR: ${results.bmr} cal\nTDEE: ${results.tdee} cal\nTarget: ${results.targetCalories} cal\n\nDiscover your metabolic potential at metabolikal.com`,
        });
      } else {
        // No share API, show download option
        setShowShareOptions(true);
      }
    } catch {
      // User cancelled or share failed, show options
      setShowShareOptions(true);
    } finally {
      setIsGeneratingImage(false);
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
      <DialogContent className="sm:max-w-3xl bg-card p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-4 bg-card border-b border-border flex-shrink-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">
            Your <span className="gradient-athletic">METABOLI-K-AL</span> Results
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm mt-2">
            Complete Metabolic Analysis + Physical + Lifestyle Integration
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
            {/* Health Score Section with Animated Chart */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-1 gradient-electric" />
                <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                  METABOLI-K-AL Health Score
                </h3>
              </div>

              {/* Main Health Score Display with Animated Chart */}
              <div className="athletic-card p-6 pl-8 flex flex-col items-center mb-4">
                <HealthScoreChart score={healthScore} size={180} animated={true} />
                <div className="mt-4 text-center">
                  <div className="text-lg font-black uppercase tracking-wide">
                    {healthTier.name}
                  </div>
                  <div className="text-sm text-muted-foreground font-bold mt-1">
                    {healthTier.description}
                  </div>
                </div>
              </div>

              {/* Score Comparison - shown when previous assessment exists */}
              {scoreComparison && (
                <div className="relative overflow-hidden bg-emerald-950/40 border border-emerald-800/50 p-5 pl-8 mb-4">
                  {/* Green left accent stripe */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-emerald-400" />

                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/20">
                      {scoreComparison.status === "improved" ? (
                        <TrendingUp className="h-6 w-6 text-emerald-500" />
                      ) : (
                        <Star className="h-6 w-6 text-yellow-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-black uppercase tracking-wide text-emerald-400 mb-1">
                        {scoreComparison.status === "improved"
                          ? "Amazing Progress!"
                          : scoreComparison.status === "same"
                            ? "Consistent Performance!"
                            : "Room to Grow!"}
                      </h4>
                      <p className="text-sm text-muted-foreground font-bold">
                        {scoreComparison.status === "improved" ? (
                          <>
                            You improved by{" "}
                            <span className="text-emerald-400">
                              +{scoreComparison.delta} points
                            </span>{" "}
                            since your last assessment!
                          </>
                        ) : scoreComparison.status === "same" ? (
                          <>
                            You maintained your score of{" "}
                            <span className="text-emerald-400">{healthScore}/100</span> since your
                            last assessment!
                          </>
                        ) : (
                          <>Your baseline is set. The METABOLIKAL system will help you improve.</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Score Breakdown: Physical vs Lifestyle */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="athletic-card p-5 pl-8 text-center">
                  <div className="text-xs font-black tracking-wider text-muted-foreground uppercase mb-2">
                    Physical Metrics
                  </div>
                  <div className="text-4xl font-black text-primary">{physicalScore}</div>
                  <div className="text-xs text-muted-foreground font-bold mt-1">Score</div>
                </div>
                <div className="athletic-card p-5 pl-8 text-center">
                  <div className="text-xs font-black tracking-wider text-muted-foreground uppercase mb-2">
                    Lifestyle Factors
                  </div>
                  <div className="text-4xl font-black text-primary">{lifestyleScore}</div>
                  <div className="text-xs text-muted-foreground font-bold mt-1">Score</div>
                </div>
              </div>
            </section>

            {/* Personalized Metabolic Profile */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-1 gradient-electric" />
                <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                  Your Personalized Metabolic Profile
                </h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                {/* Base Metabolism */}
                <div className="athletic-card p-5 pl-8">
                  <div className="text-xs font-black tracking-wider text-muted-foreground uppercase mb-2">
                    Base Metabolism
                  </div>
                  <div className="text-3xl font-black">{results.bmr.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground font-bold">cal/day</div>
                </div>

                {/* Lifestyle-Adjusted */}
                <div className="athletic-card p-5 pl-8 gradient-electric/10">
                  <div className="text-xs font-black tracking-wider text-muted-foreground uppercase mb-2">
                    Lifestyle-Adjusted
                  </div>
                  <div className="text-3xl font-black text-primary">
                    {results.tdee.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground font-bold">cal/day</div>
                </div>
              </div>

              {/* Lifestyle Boost Banner */}
              <div className="athletic-card p-4 pl-8 bg-emerald-950/30 border-emerald-800/30">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-400" />
                  <p className="text-sm font-bold text-muted-foreground">
                    Your lifestyle is boosting your metabolism by{" "}
                    <span className="text-emerald-400">
                      {lifestyleBoost.calories.toLocaleString()} calories/day (
                      {lifestyleBoost.percentage}%)
                    </span>
                  </p>
                </div>
              </div>
            </section>

            {/* Medical Considerations Section (conditional) */}
            {showMedicalConsiderations && adjustedBmr !== undefined && (
              <MedicalConsiderationsSection
                conditions={medicalConditions!}
                baseBmr={baseBmr!}
                adjustedBmr={adjustedBmr}
                totalImpactPercent={results.metabolicImpactPercent}
              />
            )}

            {/* Action Plan Section */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-1 gradient-electric" />
                <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                  Your METABOLI-K-AL Action Plan
                </h3>
              </div>

              <div className="athletic-card p-5 pl-8">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-primary" />
                  <h4 className="font-black uppercase tracking-wide">{actionPlan.name}</h4>
                </div>
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="font-black text-muted-foreground">Target:</span>{" "}
                    <span className="font-bold">{actionPlan.target}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-black text-muted-foreground">Focus:</span>{" "}
                    <span className="font-bold">{actionPlan.focus}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-black text-muted-foreground">Training:</span>{" "}
                    <span className="font-bold">{actionPlan.training}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-black text-muted-foreground">Goal:</span>{" "}
                    <span className="font-bold">{actionPlan.goal}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Fat Loss Action Plan (conditional - fat loss goal only) */}
            {isFatLossGoal && weightKg !== undefined && (
              <FatLossActionPlan
                targetCalories={results.targetCalories}
                lifestyleScore={lifestyleScore}
                physicalScore={physicalScore}
                weightKg={weightKg}
                goalWeightKg={goalWeightKg}
                nutritionDeficit={nutritionDeficit}
              />
            )}

            {/* Priority Action Plan */}
            {priorityRecommendations.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-1 gradient-electric" />
                  <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                    Your Priority Action Plan
                  </h3>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  {priorityRecommendations.map((rec: PriorityRecommendation) => {
                    const IconComponent = getRecommendationIcon(rec.icon);
                    return (
                      <div key={rec.categoryId} className="athletic-card p-5 pl-8">
                        {/* Priority Badge */}
                        <div className="inline-block px-2 py-0.5 text-xs font-black uppercase tracking-wider bg-primary/20 text-primary mb-3">
                          Priority {rec.priority}
                        </div>

                        {/* Category Header */}
                        <div className="flex items-center gap-2 mb-3">
                          <IconComponent className="h-5 w-5 text-primary" />
                          <h4 className="font-black uppercase tracking-wide text-sm">
                            {rec.categoryLabel}
                          </h4>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-muted-foreground font-bold mb-4 leading-relaxed">
                          {rec.description}
                        </p>

                        {/* Impact & Timeline */}
                        <div className="space-y-1 pt-3 border-t border-border">
                          <div className="flex items-center gap-2 text-xs">
                            <TrendingUp className="h-3 w-3 text-primary" />
                            <span className="font-black text-muted-foreground">Impact:</span>{" "}
                            <span className="font-bold">{rec.impact}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <span className="font-bold">Timeline: {rec.timeline}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Metabolic Numbers Section */}
            <section>
              <div className="flex items-center gap-3 mb-4">
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
                      Target
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

              {/* Metabolic Impact Note - Only show if medical section is not displayed */}
              {results.metabolicImpactPercent > 0 && !showMedicalConsiderations && (
                <div className="mt-4 athletic-card p-4 pl-8 bg-secondary/30">
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> Your TDEE has been adjusted by -
                    {results.metabolicImpactPercent}% based on your selected medical conditions.
                    This provides a more accurate baseline for your unique metabolic profile.
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
                  disabled={isGeneratingImage}
                  className="btn-athletic flex items-center gap-2 px-6 py-3 bg-secondary text-foreground disabled:opacity-50"
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      Share Image
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadImage}
                  disabled={isGeneratingImage}
                  className="btn-athletic flex items-center gap-2 px-6 py-3 bg-secondary text-foreground disabled:opacity-50"
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download Image
                    </>
                  )}
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
                        Copy Text
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
        </div>
      </DialogContent>

      {/* Hidden shareable image - rendered off-screen for image generation */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          width: "720px",
          overflow: "hidden",
        }}
        aria-hidden="true"
      >
        <ShareableResultsImage
          ref={shareImageRef}
          healthScore={healthScore}
          healthTierName={healthTier.name}
          lifestyleScore={lifestyleScore}
          physicalScore={physicalScore}
          bmr={results.bmr}
          tdee={results.tdee}
          lifestyleBoostPercentage={lifestyleBoost.percentage}
        />
      </div>
    </Dialog>
  );
}
