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
  ArrowRight,
  Flame,
  Clock,
  Zap,
  Trophy,
  Target,
  Dumbbell,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import {
  QuickAccessTray,
  PointsTray,
  DayCounterTray,
  MobileChallengeTray,
} from "@/components/landing/floating-trays";
import { useModalContext } from "@/contexts/modal-context";
import { useAssessment } from "@/hooks/use-assessment";
import { useCalculator, calculateHealthScore, Goal } from "@/hooks/use-calculator";
import { useGamification } from "@/hooks/use-gamification";
import { CalculatorFormData } from "@/lib/validations";
import { useState, useEffect } from "react";

// Dynamic imports for modals - reduces initial bundle size
// Modals are only loaded when opened
const CalendlyModal = dynamic(
  () =>
    import("@/components/landing/modals/calendly-modal").then((m) => ({
      default: m.CalendlyModal,
    })),
  { ssr: false }
);
const RealResultsModal = dynamic(() =>
  import("@/components/landing/modals/real-results-modal").then((m) => ({
    default: m.RealResultsModal,
  }))
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

export default function LandingPage() {
  const { activeModal, openModal, closeModal } = useModalContext();

  // Assessment flow state
  const { scores, updateScore, lifestyleScore } = useAssessment();
  const [calculatorData, setCalculatorData] = useState<CalculatorFormData | null>(null);
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
          medicalConditions: calculatorData.medicalConditions,
        }
      : null
  );

  const healthScore = calculatorResults
    ? calculateHealthScore(
        lifestyleScore,
        calculatorResults.metabolicImpactPercent,
        calculatorResults.targetCalories
      )
    : 0;

  // Gamification state
  const gamification = useGamification();
  const {
    awardAssessmentPoints,
    awardCalculatorPoints,
    isLoading: gamificationLoading,
  } = gamification;

  // Award points when assessment is completed
  useEffect(() => {
    if (lifestyleScore > 0) {
      awardAssessmentPoints(25);
    }
  }, [lifestyleScore, awardAssessmentPoints]);

  // Award points when calculator is completed
  useEffect(() => {
    if (calculatorResults) {
      awardCalculatorPoints(25);
    }
  }, [calculatorResults, awardCalculatorPoints]);

  // Handler for when assessment continues to calculator
  const handleAssessmentContinue = () => {
    openModal("calculator");
  };

  // Handler for when calculator completes
  const handleCalculatorComplete = (data: CalculatorFormData) => {
    setCalculatorData(data);
    openModal("results");
  };

  // Handler for body fat guide from calculator
  const handleOpenBodyFatGuide = () => {
    openModal("body-fat-guide");
  };

  // Handler for User Guide -> Challenge Hub flow
  const handleLaunchChallengeHub = () => {
    closeModal();
    setTimeout(() => openModal("challenge-hub"), 100);
  };

  return (
    <div className="relative">
      {/* Floating Trays (desktop only) */}
      {!gamificationLoading && (
        <>
          <QuickAccessTray
            onOpenRealResults={() => openModal("real-results")}
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
            onOpenChallengeHub={() => openModal("challenge-hub")}
          />

          {/* Mobile Tray */}
          <MobileChallengeTray
            currentDay={gamification.currentDay}
            totalPoints={gamification.totalPoints}
            dayStreak={gamification.dayStreak}
            onOpenChallengeHub={() => openModal("challenge-hub")}
          />
        </>
      )}

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center px-6 pt-20 overflow-hidden diagonal-stripes">
        {/* Angled accent background */}
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-bl from-primary/10 via-transparent to-transparent skew-x-12 origin-top-right" />

        <div className="relative z-10 mx-auto max-w-7xl w-full py-12 sm:py-16 lg:py-20">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left - Content */}
            <div className="lg:col-span-7">
              {/* Badge */}
              <div className="animate-slide-power inline-flex items-center gap-2 px-4 py-2 bg-secondary mb-8">
                <Flame className="h-4 w-4 text-primary" />
                <span className="text-xs font-black tracking-[0.2em] text-muted-foreground uppercase">
                  Metabolic Transformation
                </span>
              </div>

              {/* Quote */}
              <div className="animate-slide-power delay-100">
                <blockquote className="mb-8">
                  <p className="text-4xl md:text-5xl lg:text-6xl font-black leading-[0.95] tracking-tight uppercase">
                    &ldquo;My clients complain that I make them{" "}
                    <span className="gradient-athletic">eat too much</span>&rdquo;
                  </p>
                </blockquote>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-1 gradient-electric" />
                  <cite className="text-sm font-black tracking-[0.15em] text-muted-foreground uppercase not-italic">
                    Shivashish Sinha
                    <span className="block text-xs text-primary mt-1">Founder | Metaboli-k-al</span>
                  </cite>
                </div>
              </div>

              {/* Subtitle */}
              <p className="animate-slide-power delay-200 mt-10 text-lg text-muted-foreground font-bold max-w-xl leading-relaxed">
                The structured lifestyle reset engineered for high-performing professionals who live
                off calendars, deadlines, and chaos.
              </p>

              {/* CTAs */}
              <div className="animate-slide-power delay-300 mt-10 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => openModal("calendly")}
                  className="btn-athletic group flex items-center justify-center gap-3 px-8 py-5 gradient-electric text-black glow-power"
                >
                  <Flame className="h-5 w-5" />
                  Get Free Strategy Session
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  onClick={() => openModal("assessment")}
                  className="btn-athletic group flex items-center justify-center gap-3 px-8 py-5 bg-secondary text-foreground"
                >
                  <Target className="h-5 w-5 text-primary" />
                  Take Assessment
                </button>
              </div>

              {/* Third CTA */}
              <div className="animate-slide-power delay-400 mt-6">
                <a
                  href="#challenge"
                  className="text-sm font-bold text-primary hover:text-accent tracking-wider uppercase group flex items-center gap-2 cursor-pointer"
                >
                  <Trophy className="h-4 w-4" />
                  Start 30-Day Challenge
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>

            {/* Right - Stats */}
            <div className="lg:col-span-5 animate-slide-power delay-400">
              <div className="athletic-card p-6 pl-8 sm:p-8 sm:pl-10">
                <h3 className="text-xs font-black tracking-[0.2em] text-primary mb-8 uppercase">
                  Program Stats
                </h3>

                <div className="space-y-8">
                  {[
                    { number: "4", label: "Phases", sublabel: "Complete System", icon: Dumbbell },
                    { number: "180", label: "Minutes", sublabel: "Weekly Training", icon: Clock },
                    { number: "0", label: "Burnout", sublabel: "Sustainable Intensity", icon: Zap },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center gap-6">
                      <div className="p-3 bg-secondary">
                        <stat.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="number-highlight">{stat.number}</span>
                          <span className="text-xl font-black uppercase tracking-tight">
                            {stat.label}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          {stat.sublabel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tagline */}
                <div className="mt-10 pt-8 border-t border-border">
                  <p className="text-xs font-black tracking-[0.25em] text-muted-foreground uppercase">
                    Reprogram your rhythm.{" "}
                    <span className="gradient-athletic">Master your metabolism.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
          <p className="text-muted-foreground font-bold max-w-xl mb-12">
            See the results of executives who mastered their metabolic operating system
          </p>

          <button
            onClick={() => openModal("real-results")}
            className="btn-athletic group flex items-center gap-3 px-8 py-4 bg-secondary text-foreground"
          >
            View Transformation Gallery
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
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
              onClick={() => openModal("challenge-hub")}
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
      <RealResultsModal
        open={activeModal === "real-results"}
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
        onOpenChallenge={() => openModal("challenge-hub")}
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
        goal={(calculatorData?.goal as Goal) || "fat_loss"}
        onBookCall={() => openModal("calendly")}
      />
      <BodyFatGuideModal
        open={activeModal === "body-fat-guide"}
        onOpenChange={(open) => !open && closeModal()}
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
    </div>
  );
}
