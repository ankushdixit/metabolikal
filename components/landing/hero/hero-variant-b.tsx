"use client";

import { useEffect, useState } from "react";
import { Flame, Play, Zap, Target, TrendingUp } from "lucide-react";
import { HeroBackground, HeroCTA, HeroEyebrow } from "./shared";

interface HeroVariantBProps {
  onOpenCalendly: () => void;
  onOpenRealResults: () => void;
}

/**
 * Counter animation hook for results banner
 */
function useCountUp(target: number, duration: number = 2000, delay: number = 500) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      let startTime: number | null = null;

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out quad
        const easeOut = 1 - (1 - progress) * (1 - progress);
        setCount(Math.floor(easeOut * target));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(timer);
  }, [target, duration, delay]);

  return count;
}

/**
 * Hero Variant B: Results/Transformation Focus
 *
 * Strategy: Lead with specific, measurable outcomes that high-performers
 * care about. Use concrete numbers and results to establish credibility
 * immediately.
 */
export function HeroVariantB({ onOpenCalendly, onOpenRealResults }: HeroVariantBProps) {
  const weightLoss = useCountUp(8, 1500, 800);
  const energyIncrease = useCountUp(40, 1500, 1000);

  const resultsBanner = [
    { value: `${weightLoss}kg`, label: "avg. loss" },
    { value: `${energyIncrease}%`, label: "energy up" },
    { value: "0", label: "extreme diets" },
    { value: "12wk", label: "program" },
  ];

  const transformationPhases = [
    { week: "1-4", phase: "Reset Phase", description: "Fix metabolic foundations" },
    { week: "5-8", phase: "Acceleration", description: "Unlock fat burning" },
    { week: "9-12", phase: "Optimization", description: "Lock in lasting results" },
  ];

  return (
    <section
      className="relative min-h-screen flex items-center px-6 pt-20 overflow-hidden"
      aria-label="Hero section"
    >
      <HeroBackground variant="default" />

      <div className="relative z-10 mx-auto max-w-7xl w-full py-12 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left - Content */}
          <div className="lg:col-span-7">
            {/* Eyebrow Badge */}
            <HeroEyebrow text="Metabolic Optimization for Peak Performance" icon={TrendingUp} />

            {/* Main Headline - Stacked for impact */}
            <h1 className="animate-slide-power delay-100 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight uppercase mb-6">
              <span className="block">Reclaim Your</span>
              <span className="block gradient-athletic">Energy.</span>
              <span className="block">Lose the Weight.</span>
              <span className="block text-muted-foreground text-[0.85em]">Keep Your Schedule.</span>
            </h1>

            {/* Sub-headline */}
            <p className="animate-slide-power delay-200 text-base text-muted-foreground font-bold max-w-lg leading-relaxed mb-6">
              Join 200+ professionals who&apos;ve transformed their metabolism without sacrificing
              career momentum.
            </p>

            {/* Results Banner - Horizontal */}
            <div className="animate-slide-power delay-200 mb-6">
              <div
                className="inline-flex flex-wrap gap-1 p-1 bg-secondary/50 backdrop-blur-sm border border-primary/20"
                role="list"
                aria-label="Program results"
              >
                {resultsBanner.map((stat, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center px-3 py-2 sm:px-4"
                    role="listitem"
                  >
                    <span className="text-xl sm:text-2xl font-black gradient-athletic">
                      {stat.value}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="animate-slide-power delay-300 flex flex-col sm:flex-row gap-3 mb-6">
              <HeroCTA
                label="Start Your Transformation"
                onClick={onOpenCalendly}
                icon={Flame}
                variant="primary"
                showArrow
                ariaLabel="Start your transformation journey"
              />
              <HeroCTA
                label="See Real Results"
                onClick={onOpenRealResults}
                icon={Play}
                variant="secondary"
                ariaLabel="View real client results"
              />
            </div>

            {/* Founder Quote as Social Proof */}
            <div className="animate-slide-power delay-400">
              <blockquote className="text-sm italic text-muted-foreground mb-1">
                &ldquo;My clients complain that I make them eat too much.&rdquo;
              </blockquote>
              <cite className="text-xs font-bold text-foreground not-italic">
                — Shivashish Sinha, Founder
              </cite>
            </div>
          </div>

          {/* Right - Transformation Preview Card */}
          <div className="lg:col-span-5 animate-slide-power delay-400">
            <div className="athletic-card p-6 pl-8 sm:p-8 sm:pl-10">
              <h3 className="text-xs font-black tracking-[0.2em] text-primary mb-6 uppercase flex items-center gap-2">
                <Target className="h-4 w-4" aria-hidden="true" />
                Transformation Preview
              </h3>

              <div className="space-y-6">
                {transformationPhases.map((phase, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex flex-col items-center min-w-[50px]">
                      <span className="text-[10px] font-bold text-primary uppercase">Week</span>
                      <span className="text-2xl font-black">{phase.week}</span>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
                        <span className="text-sm font-black uppercase tracking-wide">
                          {phase.phase}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-bold">{phase.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tagline */}
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-xs font-black tracking-[0.15em] text-muted-foreground uppercase">
                  Avg. client loses 8kg in 12 weeks.{" "}
                  <span className="gradient-athletic">While eating more.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
