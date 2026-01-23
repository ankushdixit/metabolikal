"use client";

import {
  ArrowRight,
  Flame,
  Clock,
  Zap,
  Trophy,
  Target,
  Dumbbell,
  ChevronRight,
} from "lucide-react";
import { HeroBackground } from "./shared";

interface HeroOriginalProps {
  onOpenCalendly: () => void;
  onOpenAssessment: () => void;
  onOpenChallengeHub: () => void;
}

/**
 * Original Hero Section
 *
 * The original design using the founder quote:
 * "My clients complain that I make them eat too much"
 *
 * Preserved for A/B testing comparison with new variants.
 */
export function HeroOriginal({
  onOpenCalendly,
  onOpenAssessment,
  onOpenChallengeHub,
}: HeroOriginalProps) {
  const stats = [
    { number: "4", label: "Phases", sublabel: "Complete System", icon: Dumbbell },
    { number: "180", label: "Minutes", sublabel: "Weekly Training", icon: Clock },
    { number: "0", label: "Burnout", sublabel: "Sustainable Intensity", icon: Zap },
  ];

  return (
    <section
      className="relative min-h-screen flex items-center px-6 pt-20 overflow-hidden diagonal-stripes"
      aria-label="Hero section"
    >
      <HeroBackground variant="default" />

      <div className="relative z-10 mx-auto max-w-7xl w-full py-12 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left - Content */}
          <div className="lg:col-span-7">
            {/* Badge */}
            <div className="animate-slide-power inline-flex items-center gap-2 px-4 py-2 bg-secondary mb-8">
              <Flame className="h-4 w-4 text-primary" aria-hidden="true" />
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
                onClick={onOpenCalendly}
                className="btn-athletic group flex items-center justify-center gap-3 px-8 py-5 gradient-electric text-black glow-power"
                aria-label="Get a free strategy session"
              >
                <Flame className="h-5 w-5" aria-hidden="true" />
                Get Free Strategy Session
                <ChevronRight
                  className="h-5 w-5 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </button>

              <button
                onClick={onOpenAssessment}
                className="btn-athletic group flex items-center justify-center gap-3 px-8 py-5 bg-secondary text-foreground"
                aria-label="Take the assessment"
              >
                <Target className="h-5 w-5 text-primary" aria-hidden="true" />
                Take Assessment
              </button>
            </div>

            {/* Third CTA */}
            <div className="animate-slide-power delay-400 mt-6">
              <button
                onClick={onOpenChallengeHub}
                className="text-sm font-bold text-primary hover:text-accent tracking-wider uppercase group flex items-center gap-2 cursor-pointer bg-transparent border-none"
                aria-label="Start the 30 day challenge"
              >
                <Trophy className="h-4 w-4" aria-hidden="true" />
                Start 30-Day Challenge
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          {/* Right - Stats */}
          <div className="lg:col-span-5 animate-slide-power delay-400">
            <div className="athletic-card p-6 pl-8 sm:p-8 sm:pl-10">
              <h3 className="text-xs font-black tracking-[0.2em] text-primary mb-8 uppercase">
                Program Stats
              </h3>

              <div className="space-y-8">
                {stats.map((stat, i) => (
                  <div key={i} className="flex items-center gap-6">
                    <div className="p-3 bg-secondary" aria-hidden="true">
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
  );
}
