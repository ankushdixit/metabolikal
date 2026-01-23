"use client";

import { Calendar, ClipboardCheck, Clock, UserCheck, Sparkles, CheckCircle } from "lucide-react";
import { HeroBackground, HeroCTA, HeroEyebrow } from "./shared";

interface HeroVariantAProps {
  onOpenCalendly: () => void;
  onOpenAssessment: () => void;
}

/**
 * Hero Variant A: Problem-Solution Focus
 *
 * Strategy: Lead with the problem busy professionals face, then position
 * Metabolikal as the science-backed solution. This approach validates the
 * visitor's frustration before offering hope.
 */
export function HeroVariantA({ onOpenCalendly, onOpenAssessment }: HeroVariantAProps) {
  const supportingPoints = [
    {
      icon: Clock,
      text: "No extreme protocols or 6am gym sessions required",
    },
    {
      icon: Calendar,
      text: "Personalized nutrition that works with your calendar, not against it",
    },
    {
      icon: UserCheck,
      text: "1-on-1 coaching from metabolic specialists, not generic meal plans",
    },
  ];

  const stats = [
    { number: "12", label: "Weeks", sublabel: "Complete Program" },
    { number: "1-on-1", label: "", sublabel: "Personal Coaching" },
    { number: "200+", label: "", sublabel: "Professionals Coached" },
    { number: "0", label: "", sublabel: "Cookie-Cutter Plans" },
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
            <HeroEyebrow text="For High-Performing Professionals" icon={Sparkles} />

            {/* Main Headline */}
            <div className="animate-slide-power delay-100">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[0.95] tracking-tight uppercase mb-6">
                Tired of Diets That Ignore Your{" "}
                <span className="gradient-athletic">Demanding Schedule</span>?
              </h1>
            </div>

            {/* Sub-headline */}
            <p className="animate-slide-power delay-200 text-lg text-muted-foreground font-bold max-w-xl leading-relaxed mb-8">
              Metabolikal is science-based metabolic coaching built for executives, founders, and
              professionals who can&apos;t afford to sacrifice performance for fitness.
            </p>

            {/* Supporting Bullets */}
            <ul className="animate-slide-power delay-200 space-y-4 mb-10">
              {supportingPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="p-1.5 bg-secondary mt-0.5">
                    <point.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  </div>
                  <span className="text-sm text-muted-foreground font-bold">{point.text}</span>
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="animate-slide-power delay-300 flex flex-col sm:flex-row gap-3">
              <HeroCTA
                label="Book Free Strategy Call"
                onClick={onOpenCalendly}
                icon={Calendar}
                variant="primary"
                showArrow
                ariaLabel="Book a free strategy call"
              />
              <HeroCTA
                label="Take the 2-Min Assessment"
                onClick={onOpenAssessment}
                icon={ClipboardCheck}
                variant="secondary"
                ariaLabel="Take the two minute assessment"
              />
            </div>

            {/* Social Proof */}
            <div className="animate-slide-power delay-400 mt-8 flex items-center gap-4">
              <div className="flex -space-x-2" aria-hidden="true">
                {["AK", "RJ", "MS", "VP"].map((initials, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-accent/60 border-2 border-background flex items-center justify-center"
                  >
                    <span className="text-[10px] font-black text-black">{initials}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm font-bold text-muted-foreground">
                Trusted by <span className="text-foreground">200+ executives</span> and founders
              </p>
            </div>
          </div>

          {/* Right - Stats Card */}
          <div className="lg:col-span-5 animate-slide-power delay-400">
            <div className="athletic-card p-6 pl-8 sm:p-8 sm:pl-10">
              <h3 className="text-xs font-black tracking-[0.2em] text-primary mb-8 uppercase">
                Program Overview
              </h3>

              <div className="space-y-6">
                {stats.map((stat, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="p-2 bg-secondary">
                      <CheckCircle className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        {stat.number && (
                          <span className="text-2xl font-black gradient-athletic">
                            {stat.number}
                          </span>
                        )}
                        {stat.label && (
                          <span className="text-lg font-black uppercase tracking-tight">
                            {stat.label}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {stat.sublabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-xs font-black tracking-[0.15em] text-muted-foreground uppercase">
                  Science-backed. <span className="gradient-athletic">Results-guaranteed.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
