"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Target,
  RefreshCw,
  Dumbbell,
  Shield,
  Activity,
  Clock,
  Utensils,
  Brain,
  Heart,
} from "lucide-react";

interface MethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PHASES = [
  {
    number: 0,
    title: "BASELINE & AUDIT",
    subtitle: "Foundation Phase",
    duration: "4-5 days",
    purpose: "Establish your metabolic baseline and strategy roadmap.",
    includes: [
      "Lifestyle & rhythm audit",
      "Goal-setting & optimization framework",
      "Personalized metabolic strategy",
    ],
    outcome: "Clarity. Direction. Measurable success metrics.",
    icon: Target,
  },
  {
    number: 1,
    title: "REBALANCE",
    subtitle: "Reset Phase",
    duration: null,
    purpose:
      "Eliminate inefficiencies, stabilize energy, and reset internal systems for executive-grade biological balance.",
    includes: [
      "Glucose optimization protocols",
      "Premium anti-inflammatory nutrition",
      "Circadian rhythm & sleep optimization",
      "Executive movement & mindfulness",
    ],
    outcome: "Stable energy, reduced cravings, sharp focus, and restorative recovery.",
    icon: RefreshCw,
  },
  {
    number: 2,
    title: "REWIRE",
    subtitle: "Building Phase",
    duration: null,
    purpose: "Build elite consistency, metabolic strength, and emotional resilience.",
    includes: [
      "Strength & mobility protocols",
      "Macro precision & timing",
      "High-performer routines",
      "Executive consistency systems",
    ],
    outcome: "Peak metabolic performance, elite focus, and unshakable discipline.",
    icon: Dumbbell,
  },
  {
    number: 3,
    title: "REINFORCE",
    subtitle: "Freedom Phase",
    duration: null,
    purpose: "Integrate elite habits into your lifestyle — where performance becomes effortless.",
    includes: [
      "Executive dining & social protocols",
      "Strategic fasting & nutrition timing",
      "Performance journaling",
      "Identity-based transformation",
    ],
    outcome:
      "Freedom with food, confidence in body, mastery over energy, and sustained elite identity.",
    icon: Shield,
  },
];

const PILLARS = [
  {
    icon: Activity,
    title: "Metabolic Reset Protocol",
    description:
      "Advanced strategies to restore optimal metabolic function, hormone balance, and cellular energy production.",
  },
  {
    icon: Utensils,
    title: "Rhythm-Based Nutrition",
    description:
      "Precision meal timing and macronutrient strategies aligned with your circadian rhythm and professional schedule.",
  },
  {
    icon: Clock,
    title: "Strategic Movement Design",
    description:
      "Time-efficient exercise protocols that maximize metabolic impact while fitting your demanding schedule.",
  },
  {
    icon: Heart,
    title: "Stress & Recovery Optimization",
    description:
      "Evidence-based techniques to manage professional stress and optimize recovery for peak performance.",
  },
  {
    icon: Brain,
    title: "Mindset & Identity Transformation",
    description:
      "Psychological frameworks to build sustainable habits and align your identity with your transformation goals.",
  },
];

export function MethodModal({ open, onOpenChange }: MethodModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card p-0">
        <DialogHeader className="p-6 pb-4 sticky top-0 bg-card z-10 border-b border-border">
          <DialogTitle className="text-3xl font-black uppercase tracking-tight">
            The <span className="gradient-athletic">METABOLI-K-AL</span> Method
          </DialogTitle>
          <p className="text-muted-foreground font-bold mt-2">
            Beyond Fat Loss: Executive Metabolic Mastery
          </p>
        </DialogHeader>

        <div className="p-6 space-y-10">
          {/* Intro Quote */}
          <div className="athletic-card p-6 pl-10">
            <blockquote className="text-muted-foreground font-bold italic leading-relaxed">
              &ldquo;Elite transformation isn&apos;t about restriction. It&apos;s about
              optimization. We coach high-performers to master their metabolic operating system—not
              fight against it. Executive-grade results demand executive-grade protocols.&rdquo;
            </blockquote>
          </div>

          {/* Phases Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-1 gradient-electric" />
              <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                The 4-Phase System
              </h3>
            </div>

            <div className="space-y-6">
              {PHASES.map((phase) => (
                <div key={phase.number} className="athletic-card p-6 pl-10">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-secondary flex-shrink-0">
                      <phase.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-black tracking-wider text-primary">
                          PHASE {phase.number}
                        </span>
                        {phase.duration && (
                          <span className="px-2 py-0.5 text-xs font-bold bg-secondary text-muted-foreground">
                            {phase.duration}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xl font-black uppercase tracking-tight">{phase.title}</h4>
                      <p className="text-sm text-muted-foreground font-bold">{phase.subtitle}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-black tracking-wider text-muted-foreground uppercase block mb-2">
                        Purpose
                      </span>
                      <p className="text-sm font-bold">{phase.purpose}</p>
                    </div>

                    <div>
                      <span className="text-xs font-black tracking-wider text-muted-foreground uppercase block mb-2">
                        Includes
                      </span>
                      <ul className="space-y-1">
                        {phase.includes.map((item, i) => (
                          <li
                            key={i}
                            className="text-sm font-bold text-muted-foreground flex items-center gap-2"
                          >
                            <span className="w-1.5 h-1.5 bg-primary" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-xs font-black tracking-wider text-muted-foreground uppercase block mb-2">
                        Outcome
                      </span>
                      <p className="text-sm font-bold text-primary">{phase.outcome}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Five Pillars Section */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-1 gradient-electric" />
              <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                The 5 Pillars of Metabolikal Transformation
              </h3>
            </div>
            <p className="text-muted-foreground font-bold text-sm mb-6">
              Our comprehensive framework addresses every aspect of metabolic health for sustainable
              transformation.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {PILLARS.map((pillar, i) => (
                <div key={i} className="athletic-card p-6 pl-10 hover:glow-power transition-all">
                  <div className="p-2 bg-secondary w-fit mb-4">
                    <pillar.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-black uppercase tracking-wide mb-2">{pillar.title}</h4>
                  <p className="text-sm text-muted-foreground font-bold leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
