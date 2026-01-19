"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronRight, Star, Check } from "lucide-react";

interface EliteProgramsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenCalendly: () => void;
}

const PROGRAMS = [
  {
    name: "Core Reset",
    type: "MONTHLY COACHING",
    level: "Starting Point",
    popular: false,
    features: [
      "Personalized onboarding & comprehensive assessment",
      "Weekly routines & progress tracking",
      "WhatsApp daily check-ins & accountability",
      "Custom food strategy for your lifestyle integration",
      "4 phase progression system",
    ],
    perfectFor:
      "Executives ready to establish foundational health habits and see initial transformation results.",
  },
  {
    name: "Rhythm Rewire",
    type: "QUARTERLY INTENSIVE",
    level: "Complete System",
    popular: true,
    includesLabel: "Everything in Core Reset +",
    features: [
      "Bi-weekly 1:1 coaching calls with Shivashish",
      "Periodized training programs (4-phase system)",
      "Executive stress management toolkit",
      "Sleep optimization & leadership integration",
      "Bounce-back protocols for setbacks",
    ],
    perfectFor:
      "Busy executives who want complete transformation with structured support and accountability.",
  },
  {
    name: "The Fulmane Experience",
    type: "4-MONTH ELITE MENTORSHIP",
    level: "Elite Level",
    popular: false,
    includesLabel: "Everything in Rhythm Rewire +",
    features: [
      "Weekly 1:1 strategy sessions with Shivashish",
      "Access to exclusive content library",
      "24/7 WhatsApp priority support",
      "Leadership & executive identity coaching",
      "VIP priority support & direct access",
    ],
    perfectFor:
      "C-suite executives who want the ultimate transformation experience with maximum support.",
  },
];

const COMMON_FEATURES = {
  method: [
    "Comprehensive metabolic assessment",
    "60/40 lifestyle optimization system",
    "Executive-specific nutrition protocols",
    "Strategic movement programming",
  ],
  performance: [
    "Executive performance optimization",
    "Travel and business meal strategies",
    "Stress management for leaders",
    "Long-term sustainability protocols",
  ],
};

export function EliteProgramsModal({
  open,
  onOpenChange,
  onOpenCalendly,
}: EliteProgramsModalProps) {
  const handleCalendlyClick = () => {
    onOpenChange(false);
    onOpenCalendly();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-card p-0">
        <DialogHeader className="p-6 pb-4 sticky top-0 bg-card z-10 border-b border-border">
          <DialogTitle className="text-3xl font-black uppercase tracking-tight">
            Elite Transformation <span className="gradient-athletic">Programs</span>
          </DialogTitle>
          <p className="text-muted-foreground font-bold mt-2">
            Three premium tiers of coaching designed for professional lifestyles and
            high-performance transformation goals. All programs include the Performance Protocol.
          </p>
        </DialogHeader>

        <div className="p-6 space-y-10">
          {/* Program Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            {PROGRAMS.map((program) => (
              <div
                key={program.name}
                className={`athletic-card p-6 pl-10 relative ${
                  program.popular ? "glow-power" : ""
                }`}
              >
                {program.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 gradient-electric text-black text-xs font-black tracking-wider flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    MOST POPULAR
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-xs font-black tracking-wider text-primary uppercase mb-1">
                    {program.type}
                  </p>
                  <h3 className="text-xl font-black uppercase tracking-tight">{program.name}</h3>
                  <p className="text-sm text-muted-foreground font-bold">{program.level}</p>
                </div>

                {program.includesLabel && (
                  <p className="text-xs font-black text-primary mb-3">{program.includesLabel}</p>
                )}

                <ul className="space-y-2 mb-6">
                  {program.features.map((feature, i) => (
                    <li
                      key={i}
                      className="text-sm font-bold text-muted-foreground flex items-start gap-2"
                    >
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs font-black tracking-wider text-muted-foreground uppercase mb-2">
                    Perfect For
                  </p>
                  <p className="text-sm font-bold">{program.perfectFor}</p>
                </div>
              </div>
            ))}
          </div>

          {/* All Programs Include Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-1 gradient-electric" />
              <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                All Programs Include
              </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="athletic-card p-6 pl-10">
                <h4 className="font-black uppercase tracking-wide mb-4">
                  The METABOLI-K-AL Method
                </h4>
                <ul className="space-y-2">
                  {COMMON_FEATURES.method.map((item, i) => (
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

              <div className="athletic-card p-6 pl-10">
                <h4 className="font-black uppercase tracking-wide mb-4">Performance Integration</h4>
                <ul className="space-y-2">
                  {COMMON_FEATURES.performance.map((item, i) => (
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
            </div>
          </section>

          {/* CTA Section */}
          <section className="pt-6 border-t border-border text-center">
            <h3 className="text-xl font-black uppercase tracking-tight mb-2">
              Ready to Transform Your Executive Performance?
            </h3>
            <p className="text-muted-foreground font-bold text-sm mb-6 max-w-2xl mx-auto">
              Every program is personally designed and coached by Shivashish. No generic plans, no
              junior coaches—just elite transformation guidance.
            </p>
            <button
              onClick={handleCalendlyClick}
              className="btn-athletic group inline-flex items-center gap-3 px-8 py-5 gradient-electric text-black glow-power"
            >
              Book Your Strategy Session
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
