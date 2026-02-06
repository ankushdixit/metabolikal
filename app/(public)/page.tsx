/*
 * Design 4: Modern Athletic - Landing Page
 *
 * Design Philosophy:
 * - Sports/fitness inspired aesthetics
 * - Sharp angles and dynamic layouts
 * - High contrast visuals with electric accents
 * - Athletic typography (condensed, bold, uppercase)
 * - Energy and motion-focused animations
 */

"use client";

import dynamic from "next/dynamic";
import {
  Trophy,
  HelpCircle,
  Flame,
  ChevronRight,
  Target,
  Zap,
  Dumbbell,
  Instagram,
  ExternalLink,
} from "lucide-react";
import { HeroController } from "@/components/landing/hero";
import { YouTubeShortsCarousel } from "@/components/landing/youtube-shorts-carousel";
import { BeforeAfterCarousel } from "@/components/landing/before-after-carousel";
import {
  QuickAccessTray,
  PointsTray,
  DayCounterTray,
  MobileChallengeTray,
} from "@/components/landing/floating-trays";
import { useModalContext } from "@/contexts/modal-context";
import { useAssessment } from "@/hooks/use-assessment";
import { useAssessmentStorage, StoredAssessment } from "@/hooks/use-assessment-storage";
import {
  useCalculator,
  calculateHealthScore,
  calculateBmrMifflinStJeor,
  calculateBmrKatchMcArdle,
  calculateBmi,
  calculatePhysicalScore,
  calculateLifestyleMultiplier,
  getActivityMultiplierFromSettings,
  getGoalAdjustmentFromSettings,
  getProteinRatioFromSettings,
  Goal,
} from "@/hooks/use-calculator";
import { useCalculatorSettings } from "@/hooks/use-calculator-settings";
import { useMedicalConditions } from "@/hooks/use-medical-conditions";
import type { MedicalConditionDisplay } from "@/components/landing/medical-considerations-section";
import { useGamification } from "@/hooks/use-gamification";
import {
  useProfileCompletion,
  saveAssessmentResults,
  saveCalculatorResults,
} from "@/hooks/use-profile-completion";
import { CalculatorFormData } from "@/lib/validations";
import { generateUUID } from "@/lib/utils";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// Dynamic imports for modals - reduces initial bundle size
// Modals are only loaded when opened
const CalendlyModal = dynamic(
  () =>
    import("@/components/landing/modals/calendly-modal").then((m) => ({
      default: m.CalendlyModal,
    })),
  { ssr: false }
);
const MeetExpertModal = dynamic(() =>
  import("@/components/landing/modals/meet-expert-modal").then((m) => ({
    default: m.MeetExpertModal,
  }))
);
const MethodModal = dynamic(() =>
  import("@/components/landing/modals/method-modal").then((m) => ({ default: m.MethodModal }))
);
const EliteProgramsModal = dynamic(() =>
  import("@/components/landing/modals/elite-programs-modal").then((m) => ({
    default: m.EliteProgramsModal,
  }))
);
const HighPerformerTrapModal = dynamic(() =>
  import("@/components/landing/modals/high-performer-trap-modal").then((m) => ({
    default: m.HighPerformerTrapModal,
  }))
);
const EliteLifestylesModal = dynamic(() =>
  import("@/components/landing/modals/elite-lifestyles-modal").then((m) => ({
    default: m.EliteLifestylesModal,
  }))
);
const AssessmentModal = dynamic(() =>
  import("@/components/landing/modals/assessment-modal").then((m) => ({
    default: m.AssessmentModal,
  }))
);
const CalculatorModal = dynamic(() =>
  import("@/components/landing/modals/calculator-modal").then((m) => ({
    default: m.CalculatorModal,
  }))
);
const ResultsModal = dynamic(() =>
  import("@/components/landing/modals/results-modal").then((m) => ({ default: m.ResultsModal }))
);
const BodyFatGuideModal = dynamic(() =>
  import("@/components/landing/modals/body-fat-guide-modal").then((m) => ({
    default: m.BodyFatGuideModal,
  }))
);
const UserGuideModal = dynamic(() =>
  import("@/components/landing/modals/user-guide-modal").then((m) => ({
    default: m.UserGuideModal,
  }))
);
const ChallengeHubModal = dynamic(() =>
  import("@/components/landing/modals/challenge-hub-modal").then((m) => ({
    default: m.ChallengeHubModal,
  }))
);
const LoginRequiredModal = dynamic(() =>
  import("@/components/landing/modals/login-required-modal").then((m) => ({
    default: m.LoginRequiredModal,
  }))
);
const ProfileIncompleteModal = dynamic(() =>
  import("@/components/landing/modals/profile-incomplete-modal").then((m) => ({
    default: m.ProfileIncompleteModal,
  }))
);

const INSTAGRAM_CARDS = [
  {
    title: "Before & After Stories",
    description: "Real clients, real results, real transformations",
  },
  {
    title: "Client Wins",
    description: "Daily posts of metabolic breakthroughs",
  },
  {
    title: "Learn & Level Up",
    description: "Metabolic tips & transformation strategies",
  },
];

export default function LandingPage() {
  const { activeModal, openModal, closeModal } = useModalContext();
  const router = useRouter();

  // Track if we're redirecting to auth callback (to show loading state)
  const [isAuthRedirecting, setIsAuthRedirecting] = useState(false);

  // Check for auth tokens in URL hash (invite/magic link redirects)
  // Supabase sends invite links to the Site URL, which may be the homepage
  // If we detect auth tokens, redirect to the proper auth callback handler
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    if (!hash) return;

    const hashParams = new URLSearchParams(hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    // If auth tokens are present in hash, redirect to auth callback to process them
    if (accessToken && refreshToken) {
      setIsAuthRedirecting(true);
      // Preserve the hash fragment when redirecting
      router.replace(`/auth/callback/client${hash}`);
    }
  }, [router]);

  // Assessment storage for localStorage persistence
  const assessmentStorage = useAssessmentStorage();
  const { getPreviousAssessment, saveAssessmentWithHealthScore, saveCalculator } =
    assessmentStorage;

  // Track previous assessment for comparison (loaded once on mount)
  const [previousAssessment, setPreviousAssessment] = useState<StoredAssessment | null>(null);
  const previousAssessmentLoaded = useRef(false);

  // Load previous assessment from localStorage on mount
  useEffect(() => {
    if (!previousAssessmentLoaded.current) {
      previousAssessmentLoaded.current = true;
      const stored = getPreviousAssessment();
      if (stored) {
        setPreviousAssessment(stored);
      }
    }
  }, [getPreviousAssessment]);

  // Assessment flow state - initialize with previous scores if available
  const { scores, updateScore, setAllScores, lifestyleScore } = useAssessment();
  const scoresInitialized = useRef(false);

  // Pre-populate sliders with previous assessment values when modal opens
  useEffect(() => {
    if (activeModal === "assessment" && previousAssessment && !scoresInitialized.current) {
      scoresInitialized.current = true;
      setAllScores(previousAssessment.scores);
    }
    // Reset the flag when modal closes so it can reinitialize next time
    if (activeModal !== "assessment") {
      scoresInitialized.current = false;
    }
  }, [activeModal, previousAssessment, setAllScores]);

  // Calculator settings from admin configuration
  const { settings: calculatorSettings } = useCalculatorSettings();

  // Fetch medical conditions for resolving slugs to full objects
  const { conditions: medicalConditionsList } = useMedicalConditions();

  const [calculatorData, setCalculatorData] = useState<CalculatorFormData | null>(null);

  // State for additional results modal data
  const [resolvedMedicalConditions, setResolvedMedicalConditions] = useState<
    MedicalConditionDisplay[]
  >([]);
  const [baseBmrValue, setBaseBmrValue] = useState<number | undefined>(undefined);
  const [adjustedBmrValue, setAdjustedBmrValue] = useState<number | undefined>(undefined);
  const calculatorResults = useCalculator(
    calculatorData
      ? {
          gender: calculatorData.gender,
          age: calculatorData.age,
          weightKg: calculatorData.weightKg,
          heightCm: calculatorData.heightCm,
          bodyFatPercent: calculatorData.bodyFatPercent,
          activityLevel: calculatorData.activityLevel,
          goal: calculatorData.goal,
          goalWeightKg: calculatorData.goalWeightKg,
          metabolicImpactPercent: calculatorData.metabolicImpactPercent,
          lifestyleScore: lifestyleScore,
          settings: calculatorSettings,
        }
      : null
  );

  // Calculate physical score from BMI + body fat (per documentation)
  // This is separate from metabolic impact - physical score measures body composition
  const physicalScore =
    calculatorResults && calculatorData
      ? calculatePhysicalScore(
          calculateBmi(calculatorData.weightKg, calculatorData.heightCm),
          calculatorData.bodyFatPercent,
          calculatorData.gender,
          calculatorSettings
        )
      : 0;

  // Calculate health score using physical score (BMI + body fat) per documentation
  const healthScore =
    calculatorResults && calculatorData
      ? calculateHealthScore(
          lifestyleScore,
          physicalScore,
          calculatorResults.targetCalories,
          calculatorSettings
        )
      : 0;

  // Profile completion state for gating Challenge Hub
  const profileCompletion = useProfileCompletion();
  const {
    isAuthenticated,
    hasAssessment: profileHasAssessment,
    hasCalculator: profileHasCalculator,
    isProfileComplete,
    refetch: refetchProfileCompletion,
  } = profileCompletion;

  // Gamification state
  const gamification = useGamification();
  const {
    awardAssessmentPoints,
    awardCalculatorPoints,
    isLoading: gamificationLoading,
  } = gamification;

  // Track if points have been awarded this session to prevent infinite loops
  const assessmentPointsAwarded = useRef(false);
  const calculatorPointsAwarded = useRef(false);

  // Award points when assessment is completed (once per session)
  useEffect(() => {
    if (lifestyleScore > 0 && !assessmentPointsAwarded.current) {
      assessmentPointsAwarded.current = true;
      awardAssessmentPoints(25);
    }
  }, [lifestyleScore, awardAssessmentPoints]);

  // Award points when calculator is completed (once per session)
  useEffect(() => {
    if (calculatorResults && !calculatorPointsAwarded.current) {
      calculatorPointsAwarded.current = true;
      awardCalculatorPoints(25);
    }
  }, [calculatorResults, awardCalculatorPoints]);

  // Handle modal query parameter (e.g., from thank you page redirect)
  const searchParams = useSearchParams();
  useEffect(() => {
    const modalParam = searchParams.get("modal");
    if (modalParam === "assessment") {
      openModal("assessment");
    }
  }, [searchParams, openModal]);

  // Handler for when assessment continues to calculator
  const handleAssessmentContinue = async () => {
    // Save assessment results to database for authenticated users
    if (isAuthenticated && profileCompletion.user) {
      const visitorId = localStorage.getItem("metabolikal_visitor_id") || generateUUID();
      // Save in background - don't await or refetch to avoid UI jank
      saveAssessmentResults(profileCompletion.user.id, scores, visitorId);
    }
    openModal("calculator");
  };

  // Handler for when calculator completes
  const handleCalculatorComplete = async (data: CalculatorFormData) => {
    setCalculatorData(data);

    // Calculate results using exported functions with admin-configured settings
    // Per COMPLETE-FORMULAE-GUIDE.md, the order is: BMR → Medical → Activity → Lifestyle → Target

    // Step 1: Calculate base BMR
    const baseBmr =
      data.bodyFatPercent !== undefined
        ? calculateBmrKatchMcArdle(data.weightKg, data.bodyFatPercent)
        : calculateBmrMifflinStJeor(data.gender, data.weightKg, data.heightCm, data.age);

    // Store base BMR for results modal
    setBaseBmrValue(Math.round(baseBmr));

    // Resolve medical condition slugs to full display objects
    const resolvedConditions: MedicalConditionDisplay[] = [];
    if (data.medicalConditions && data.medicalConditions.length > 0) {
      for (const slug of data.medicalConditions) {
        if (slug === "none") continue;
        const condition = medicalConditionsList.find((c) => c.slug === slug);
        if (condition) {
          resolvedConditions.push({
            name: condition.name,
            slug: condition.slug,
            impactPercent: condition.impact_percent,
          });
        }
      }
    }
    setResolvedMedicalConditions(resolvedConditions);

    // Step 2: Apply medical conditions adjustment to BMR (per documentation)
    // Cap metabolic impact at configured maximum (default 25%)
    const metabolicImpactPercent = Math.min(
      data.metabolicImpactPercent,
      calculatorSettings.metabolic_impact_cap
    );
    const medicalMultiplier = 1 - metabolicImpactPercent / 100;
    const adjustedBmr = baseBmr * medicalMultiplier;

    // Store adjusted BMR for results modal medical considerations section
    setAdjustedBmrValue(Math.round(adjustedBmr));

    // Step 3: Calculate TDEE from adjusted BMR
    const activityMultiplier = getActivityMultiplierFromSettings(
      data.activityLevel,
      calculatorSettings
    );
    const tdee = adjustedBmr * activityMultiplier;

    // Step 4: Apply lifestyle multiplier (per documentation)
    const lifestyleMultiplier = calculateLifestyleMultiplier(lifestyleScore, calculatorSettings);
    const lifestyleAdjustedTdee = tdee * lifestyleMultiplier;

    // Step 5: Calculate target calories
    const goalAdjustment = getGoalAdjustmentFromSettings(data.goal, calculatorSettings);
    const targetCalories = Math.round(lifestyleAdjustedTdee + goalAdjustment);

    const proteinRatio = getProteinRatioFromSettings(data.goal, calculatorSettings);
    const proteinGrams = Math.round(data.weightKg * proteinRatio);

    // Calculate health score using physical score (BMI + body fat) per documentation
    const bmi = calculateBmi(data.weightKg, data.heightCm);
    const physicalScore = calculatePhysicalScore(
      bmi,
      data.bodyFatPercent,
      data.gender,
      calculatorSettings
    );
    const calculatedHealthScore = calculateHealthScore(
      lifestyleScore,
      physicalScore,
      targetCalories,
      calculatorSettings
    );

    // Save to localStorage for all users (so returning visitors see progress and for migration after signup)
    saveAssessmentWithHealthScore(scores, lifestyleScore, calculatedHealthScore);

    // Calculate macros (needed for both localStorage and database saves)
    const proteinCalories = proteinGrams * 4;
    const fatCalories = targetCalories * 0.25;
    const carbCalories = targetCalories - proteinCalories - fatCalories;
    const fatsGrams = Math.round(fatCalories / 9);
    const carbsGrams = Math.round(carbCalories / 4);

    // Save calculator to localStorage (for migration after signup)
    saveCalculator(
      {
        gender: data.gender,
        age: data.age,
        weight: data.weightKg,
        height: data.heightCm,
        activityLevel: data.activityLevel,
        goal: data.goal,
      },
      {
        bmr: Math.round(baseBmr),
        tdee: Math.round(lifestyleAdjustedTdee),
        targetCalories,
        protein: proteinGrams,
        carbs: carbsGrams,
        fats: fatsGrams,
      }
    );

    // Save calculator results to database for authenticated users
    if (isAuthenticated && profileCompletion.user) {
      // Save in background - don't await to avoid UI jank
      saveCalculatorResults(
        profileCompletion.user.id,
        {
          gender: data.gender,
          age: data.age,
          weightKg: data.weightKg,
          heightCm: data.heightCm,
          bodyFatPercent: data.bodyFatPercent,
          activityLevel: data.activityLevel,
          goal: data.goal,
          goalWeightKg: data.goalWeightKg,
          medicalConditions: data.medicalConditions,
        },
        {
          bmr: Math.round(baseBmr),
          tdee: Math.round(lifestyleAdjustedTdee),
          targetCalories,
          proteinGrams,
          carbsGrams,
          fatsGrams,
          metabolicImpactPercent,
        }
      ).then(() => {
        // Refetch profile completion in background after save completes
        refetchProfileCompletion();
      });
    }

    openModal("results");
  };

  // Handler for body fat guide from calculator - returns to calculator when closed
  const handleOpenBodyFatGuide = () => {
    openModal("body-fat-guide");
  };

  // Handler for closing body fat guide - returns to calculator
  const handleCloseBodyFatGuide = (open: boolean) => {
    if (!open) {
      openModal("calculator");
    }
  };

  // Handler for User Guide -> Challenge Hub flow
  const handleLaunchChallengeHub = () => {
    closeModal();
    setTimeout(() => openModal("challenge-hub"), 100);
  };

  /**
   * Handler for opening Challenge Hub with auth and profile checks.
   * Flow:
   * 1. Not authenticated -> show Login Required modal
   * 2. Authenticated but profile incomplete -> show Profile Incomplete modal
   * 3. Authenticated and profile complete -> show Challenge Hub modal
   */
  const handleOpenChallengeHub = useCallback(() => {
    if (!isAuthenticated) {
      openModal("login-required");
      return;
    }

    if (!isProfileComplete) {
      openModal("profile-incomplete");
      return;
    }

    openModal("challenge-hub");
  }, [isAuthenticated, isProfileComplete, openModal]);

  // Handler for starting assessment from Profile Incomplete modal
  const handleStartAssessmentFromModal = useCallback(() => {
    openModal("assessment");
  }, [openModal]);

  // Handler for starting calculator from Profile Incomplete modal
  const handleStartCalculatorFromModal = useCallback(() => {
    openModal("calculator");
  }, [openModal]);

  // Handler for scrolling to transformations section
  const handleScrollToTransformations = useCallback(() => {
    const element = document.getElementById("transformations");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Profile refetch is now handled in handleCalculatorComplete after save completes

  // Show loading state when redirecting for auth (must be after all hooks)
  if (isAuthRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground font-bold">Processing authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Floating Trays (desktop only) */}
      {!gamificationLoading && (
        <>
          <QuickAccessTray
            onOpenRealResults={handleScrollToTransformations}
            onOpenMeetExpert={() => openModal("meet-expert")}
            onOpenMethod={() => openModal("method")}
            onOpenElitePrograms={() => openModal("elite-programs")}
          />

          <PointsTray
            totalPoints={gamification.totalPoints}
            healthScore={healthScore}
            dayStreak={gamification.dayStreak}
            assessmentPoints={gamification.assessmentPoints}
            calculatorPoints={gamification.calculatorPoints}
            dailyVisitPoints={gamification.dailyVisitPoints}
            completionPercent={gamification.completionPercent}
          />

          <DayCounterTray
            currentDay={gamification.currentDay}
            totalDays={gamification.totalDays}
            onOpenChallengeHub={handleOpenChallengeHub}
          />

          {/* Mobile Tray */}
          <MobileChallengeTray
            currentDay={gamification.currentDay}
            totalDays={gamification.totalDays}
            totalPoints={gamification.totalPoints}
            dayStreak={gamification.dayStreak}
            onOpenChallengeHub={handleOpenChallengeHub}
          />
        </>
      )}

      {/* Hero Section - A/B Testing Variants */}
      <HeroController
        onOpenCalendly={() => openModal("calendly")}
        onOpenAssessment={() => openModal("assessment")}
        onOpenRealResults={handleScrollToTransformations}
        onOpenMethod={() => openModal("method")}
        onOpenChallengeHub={handleOpenChallengeHub}
      />

      {/* Transformations Section */}
      <section id="transformations" className="py-24 px-6 bg-card">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-1 gradient-electric" />
            <span className="text-xs font-black tracking-[0.2em] text-primary uppercase">
              Results
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase mb-4">
            Real People. <span className="gradient-athletic">Real Transformations.</span>
          </h2>
          <p className="text-muted-foreground font-bold max-w-xl mb-8">
            See the results of executives who mastered their metabolic operating system
          </p>

          {/* YouTube Shorts Carousel */}
          <div className="mb-12">
            <YouTubeShortsCarousel />
          </div>

          {/* Before/After Carousel Section */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-1 gradient-electric" />
              <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                Before &amp; After Results
              </h3>
            </div>
            <p className="text-muted-foreground font-bold text-sm mb-6">
              Real transformations from high-performing professionals
            </p>

            <BeforeAfterCarousel />
          </div>

          {/* Instagram Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-1 gradient-electric" />
              <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                Connect With Our Community
              </h3>
            </div>
            <p className="text-muted-foreground font-bold text-sm mb-6">
              See daily transformation stories, client wins, and metabolic breakthroughs on our
              social channels
            </p>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {INSTAGRAM_CARDS.map((card) => (
                <div
                  key={card.title}
                  className="athletic-card p-4 sm:p-6 pl-6 sm:pl-8 hover:glow-power transition-all"
                >
                  <Instagram className="h-5 w-5 sm:h-6 sm:w-6 text-primary mb-3 sm:mb-4" />
                  <h4 className="font-black uppercase tracking-wide mb-2 text-sm sm:text-base">
                    {card.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground font-bold">
                    {card.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Instagram CTA */}
            <div className="mt-8 text-center">
              <a
                href="https://www.instagram.com/metabolikal"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-athletic group inline-flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 gradient-electric text-black glow-power text-sm sm:text-base"
              >
                <Instagram className="h-5 w-5 flex-shrink-0" />
                <span className="hidden sm:inline">
                  Follow @metabolikal for Daily Transformations
                </span>
                <span className="sm:hidden">Follow @metabolikal</span>
                <ExternalLink className="h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Revelation Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 diagonal-stripes" />
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-primary/5 to-transparent" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="athletic-card p-6 sm:p-10 md:p-16 pl-8 sm:pl-12 md:pl-20">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground mb-8">
              <span className="text-xs font-black tracking-[0.15em] uppercase">The Revelation</span>
            </span>

            <h2 className="text-3xl md:text-5xl font-black leading-tight uppercase mb-6">
              You don&apos;t lack discipline.
              <br />
              <span className="gradient-athletic">Your system lacks calibration.</span>
            </h2>

            <p className="text-muted-foreground font-bold max-w-2xl mb-10">
              The inconvenient truth about why high-performers struggle with energy and
              transformation
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => openModal("high-performer-trap")}
                className="btn-athletic group flex items-center gap-3 px-6 py-4 bg-secondary text-foreground"
              >
                The High-Performer Trap
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => openModal("elite-lifestyles")}
                className="btn-athletic group flex items-center gap-3 px-6 py-4 bg-secondary text-foreground"
              >
                See Who We Work With
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6 bg-card">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-1 gradient-electric" />
            <span className="text-xs font-black tracking-[0.2em] text-primary uppercase">
              About
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase mb-4">
            About <span className="gradient-athletic">Metaboli-k-al</span>
          </h2>
          <p className="text-muted-foreground font-bold max-w-2xl mb-12">
            Because Metabolism is King — and you deserve a sovereign approach to transformation
          </p>

          {/* Quick Links */}
          <div className="flex flex-wrap gap-3 mb-16">
            <button
              onClick={() => openModal("meet-expert")}
              className="btn-athletic px-6 py-3 text-sm bg-secondary text-foreground"
            >
              Meet the Expert
            </button>
            <button
              onClick={() => openModal("method")}
              className="btn-athletic px-6 py-3 text-sm bg-secondary text-foreground"
            >
              The Method
            </button>
            <button
              onClick={() => openModal("elite-programs")}
              className="btn-athletic px-6 py-3 text-sm bg-secondary text-foreground"
            >
              Elite Programs
            </button>
          </div>

          {/* Accordions */}
          <div className="space-y-4 max-w-3xl">
            {[
              {
                title: "The Discovery",
                content:
                  "We founded METABOLI-K-AL because we discovered something revolutionary: your metabolism isn't just about calories—it's the command center of your entire physiology.",
              },
              {
                title: "Why We're Metaboli-k-al",
                content:
                  "Because Metabolism is King. The sovereign force of elite vitality. Your cellular powerhouses don't just burn fuel—they orchestrate your entire existence.",
              },
            ].map((item, i) => (
              <details key={i} className="group athletic-card pl-8 overflow-hidden">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <h3 className="text-lg font-black tracking-wide uppercase">{item.title}</h3>
                  <div className="h-8 w-8 bg-secondary flex items-center justify-center transition-transform group-open:rotate-45">
                    <span className="text-primary text-xl font-black">+</span>
                  </div>
                </summary>
                <div className="px-6 pb-6">
                  <div className="w-12 h-1 gradient-electric mb-4" />
                  <p className="text-muted-foreground font-bold leading-relaxed">{item.content}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Difference Section */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase mb-4">
              The Metaboli-k-al <span className="gradient-athletic">Difference</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                title: "Personal, Not Automated",
                description:
                  "Every elite client works directly with Shivashish. No bots, no copy-paste programs—just personalized guidance.",
              },
              {
                icon: Dumbbell,
                title: "Science-Based, Tested",
                description:
                  "This isn't trendy—it's tested. Each step grounded in real-world application with hundreds of high-performers.",
              },
              {
                icon: Zap,
                title: "Built for Elite Lifestyles",
                description:
                  "No extreme protocols, no unsustainable demands. Every strategy integrates your executive lifestyle.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="athletic-card p-6 pl-8 sm:p-8 sm:pl-10 hover:glow-power transition-all"
              >
                <div className="p-3 bg-secondary w-fit mb-6">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-black mb-4 uppercase tracking-wide">{item.title}</h3>
                <p className="text-sm text-muted-foreground font-bold leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-4">
              <div className="w-12 h-1 gradient-electric" />
              <p className="text-2xl md:text-3xl font-black tracking-tight uppercase">
                You don&apos;t need more hustle.{" "}
                <span className="gradient-athletic">You need rhythm.</span>
              </p>
              <div className="w-12 h-1 gradient-electric" />
            </div>
          </div>
        </div>
      </section>

      {/* Challenge Section */}
      <section id="challenge" className="py-24 px-6 bg-card relative overflow-hidden">
        <div className="absolute inset-0 diagonal-stripes" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 px-6 py-3 gradient-electric text-black mb-8">
            <Trophy className="h-5 w-5" />
            <span className="text-sm font-black tracking-[0.15em] uppercase">
              Still Not Sure? Take the Challenge
            </span>
          </span>

          <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase mb-4">
            Start Your <span className="gradient-athletic">Metabolic Challenge</span>
          </h2>

          <p className="text-muted-foreground font-bold max-w-xl mx-auto mb-12">
            Join professionals transforming their metabolic systems with proven strategies
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <button
              onClick={() => openModal("user-guide")}
              className="btn-athletic group flex items-center gap-3 px-6 py-4 bg-secondary text-foreground"
            >
              <HelpCircle className="h-5 w-5 text-primary" />
              How It Works
            </button>

            <button
              onClick={handleOpenChallengeHub}
              className="btn-athletic group flex items-center gap-3 px-8 py-5 gradient-electric text-black glow-power"
            >
              <Flame className="h-5 w-5" />
              Launch Challenge Hub
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap justify-center gap-3">
            {["Science-Backed", "Personalized", "Sustainable"].map((tag) => (
              <span
                key={tag}
                className="px-4 py-2 text-xs font-black tracking-wider text-primary bg-secondary uppercase"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Modals */}
      <CalendlyModal
        open={activeModal === "calendly"}
        onOpenChange={(open) => !open && closeModal()}
      />
      <MeetExpertModal
        open={activeModal === "meet-expert"}
        onOpenChange={(open) => !open && closeModal()}
        onOpenCalendly={() => openModal("calendly")}
      />
      <MethodModal open={activeModal === "method"} onOpenChange={(open) => !open && closeModal()} />
      <EliteProgramsModal
        open={activeModal === "elite-programs"}
        onOpenChange={(open) => !open && closeModal()}
        onOpenCalendly={() => openModal("calendly")}
      />
      <HighPerformerTrapModal
        open={activeModal === "high-performer-trap"}
        onOpenChange={(open) => !open && closeModal()}
        onOpenCalendly={() => openModal("calendly")}
        onOpenAssessment={() => openModal("assessment")}
        onOpenChallenge={handleOpenChallengeHub}
      />
      <EliteLifestylesModal
        open={activeModal === "elite-lifestyles"}
        onOpenChange={(open) => !open && closeModal()}
        onOpenCalendly={() => openModal("calendly")}
      />
      <AssessmentModal
        open={activeModal === "assessment"}
        onOpenChange={(open) => !open && closeModal()}
        scores={scores}
        onScoreChange={updateScore}
        onContinue={handleAssessmentContinue}
        previousAssessment={previousAssessment}
      />
      <CalculatorModal
        open={activeModal === "calculator"}
        onOpenChange={(open) => !open && closeModal()}
        onCalculate={handleCalculatorComplete}
        onOpenBodyFatGuide={handleOpenBodyFatGuide}
      />
      <ResultsModal
        open={activeModal === "results"}
        onOpenChange={(open) => !open && closeModal()}
        results={calculatorResults}
        lifestyleScore={lifestyleScore}
        healthScore={healthScore}
        physicalScore={physicalScore}
        goal={(calculatorData?.goal as Goal) || "fat_loss"}
        onBookCall={() => openModal("calendly")}
        previousAssessment={previousAssessment}
        assessmentScores={scores}
        medicalConditions={resolvedMedicalConditions}
        baseBmr={baseBmrValue}
        adjustedBmr={adjustedBmrValue}
        weightKg={calculatorData?.weightKg}
        goalWeightKg={calculatorData?.goalWeightKg}
        calculatorSettings={calculatorSettings}
      />
      <BodyFatGuideModal
        open={activeModal === "body-fat-guide"}
        onOpenChange={handleCloseBodyFatGuide}
      />
      <UserGuideModal
        open={activeModal === "user-guide"}
        onOpenChange={(open) => !open && closeModal()}
        onLaunchChallenge={handleLaunchChallengeHub}
      />
      <ChallengeHubModal
        open={activeModal === "challenge-hub"}
        onOpenChange={(open) => !open && closeModal()}
        gamification={gamification}
      />
      <LoginRequiredModal
        open={activeModal === "login-required"}
        onOpenChange={(open) => !open && closeModal()}
      />
      <ProfileIncompleteModal
        open={activeModal === "profile-incomplete"}
        onOpenChange={(open) => !open && closeModal()}
        onStartAssessment={handleStartAssessmentFromModal}
        onStartCalculator={handleStartCalculatorFromModal}
        hasAssessment={profileHasAssessment}
        hasCalculator={profileHasCalculator}
      />
    </div>
  );
}
