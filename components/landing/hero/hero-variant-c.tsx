"use client";

import { useState, useEffect } from "react";
import { Shield, ArrowRight, Check, Star, Award, Briefcase } from "lucide-react";
import { HeroBackground, HeroCTA, HeroEyebrow } from "./shared";

interface HeroVariantCProps {
  onOpenCalendly: () => void;
  onOpenMethod: () => void;
}

/**
 * Hero Variant C: Identity/Positioning Focus
 *
 * Strategy: Lead with who this is for, creating immediate self-identification.
 * Uses aspirational "elite" positioning that resonates with the target
 * audience's identity.
 */
export function HeroVariantC({ onOpenCalendly, onOpenMethod }: HeroVariantCProps) {
  const [animatedChecks, setAnimatedChecks] = useState<boolean[]>([false, false, false, false]);

  const identityChecklist = [
    "You've succeeded at everything except sustainable fitness",
    "You're skeptical of cookie-cutter programs",
    "You refuse to sacrifice career performance for health",
    "You want science, not fitness influencer nonsense",
  ];

  const coachCredentials = [
    { icon: Briefcase, text: "200+ clients coached" },
    { icon: Award, text: "15 years experience" },
    { icon: Star, text: "Certified Metabolic Specialist" },
  ];

  // Animate checkmarks sequentially
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    identityChecklist.forEach((_, i) => {
      timers.push(
        setTimeout(
          () => {
            setAnimatedChecks((prev) => {
              const next = [...prev];
              next[i] = true;
              return next;
            });
          },
          1200 + i * 300
        )
      );
    });
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <section
      className="relative min-h-screen flex items-center px-6 pt-20 overflow-hidden"
      aria-label="Hero section"
    >
      <HeroBackground variant="darker" />

      <div className="relative z-10 mx-auto max-w-7xl w-full py-12 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left - Content (Copy-heavy) */}
          <div className="lg:col-span-7">
            {/* Eyebrow Badge with premium feel */}
            <HeroEyebrow text="The Metabolic Operating System for Elite Performers" icon={Shield} />

            {/* Main Headline with strikethrough effect */}
            <div className="animate-slide-power delay-100">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[0.95] tracking-tight uppercase mb-6">
                You Don&apos;t Need Another{" "}
                <span className="relative inline-block">
                  <span className="line-through decoration-primary decoration-4 opacity-60">
                    Diet
                  </span>
                </span>
                .
                <br />
                You Need a <span className="gradient-athletic">System</span>.
              </h1>
            </div>

            {/* Sub-headline */}
            <p className="animate-slide-power delay-200 text-lg text-muted-foreground font-bold max-w-xl leading-relaxed mb-8">
              Metabolikal is personalized metabolic coaching for executives and founders who&apos;ve
              tried everything—and are ready for an approach that actually fits their life.
            </p>

            {/* Identity Checklist */}
            <div className="animate-slide-power delay-200 mb-10">
              <p className="text-sm font-black tracking-[0.15em] text-primary uppercase mb-4">
                This is for you if:
              </p>
              <ul className="space-y-3" role="list">
                {identityChecklist.map((item, i) => (
                  <li
                    key={i}
                    className={`flex items-start gap-3 transition-all duration-300 ${
                      animatedChecks[i] ? "opacity-100 translate-x-0" : "opacity-50 -translate-x-2"
                    }`}
                  >
                    <div
                      className={`p-1 mt-0.5 transition-colors duration-300 ${
                        animatedChecks[i] ? "bg-primary" : "bg-secondary"
                      }`}
                    >
                      <Check
                        className={`h-3 w-3 transition-colors duration-300 ${
                          animatedChecks[i] ? "text-black" : "text-primary"
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground font-bold">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTAs with exclusivity hint */}
            <div className="animate-slide-power delay-300">
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <HeroCTA
                  label="See If You Qualify"
                  onClick={onOpenCalendly}
                  icon={Shield}
                  variant="primary"
                  showArrow
                  ariaLabel="Check if you qualify for the program"
                />
                <HeroCTA
                  label="How It Works"
                  onClick={onOpenMethod}
                  icon={ArrowRight}
                  variant="secondary"
                  ariaLabel="Learn how the program works"
                />
              </div>
              {/* Exclusivity badge */}
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Limited spots available each month
              </p>
            </div>

            {/* Positioning Statement */}
            <div className="animate-slide-power delay-400 mt-10">
              <div className="inline-flex items-center gap-3">
                <div className="w-8 h-1 gradient-electric" />
                <p className="text-sm font-black tracking-[0.15em] text-muted-foreground uppercase">
                  Built for the 1% who demand more.
                </p>
              </div>
            </div>
          </div>

          {/* Right - Coach Profile Card */}
          <div className="lg:col-span-5 animate-slide-power delay-400">
            <div className="athletic-card p-6 pl-8 sm:p-8 sm:pl-10">
              {/* Coach Avatar Placeholder */}
              <div className="mb-6">
                <div className="w-24 h-24 bg-secondary border-2 border-primary flex items-center justify-center mb-4">
                  <span className="text-3xl font-black gradient-athletic">SS</span>
                </div>
              </div>

              {/* Coach Quote */}
              <blockquote className="mb-6">
                <p className="text-lg font-black italic text-foreground mb-2">
                  &ldquo;This isn&apos;t fitness. It&apos;s metabolic engineering.&rdquo;
                </p>
              </blockquote>

              {/* Coach Info */}
              <div className="mb-6">
                <h3 className="text-lg font-black tracking-wide uppercase mb-1">
                  Shivashish Sinha
                </h3>
                <p className="text-sm font-bold text-primary uppercase tracking-wider">
                  Founder & Head Coach
                </p>
              </div>

              {/* Credentials */}
              <ul className="space-y-3" role="list">
                {coachCredentials.map((credential, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="p-1.5 bg-secondary">
                      <credential.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                    </div>
                    <span className="text-sm text-muted-foreground font-bold">
                      {credential.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Tagline */}
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-xs font-black tracking-[0.15em] text-muted-foreground uppercase">
                  Personal guidance. <span className="gradient-athletic">Elite results.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
