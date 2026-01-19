"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertTriangle, ChevronRight, Target, Trophy } from "lucide-react";

interface HighPerformerTrapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenCalendly: () => void;
  onOpenAssessment?: () => void;
  onOpenChallenge?: () => void;
}

const TRAPS = [
  {
    title: "Decision Fatigue Hits at 3PM",
    description: "Million-dollar decisions compromised by metabolic crashes",
  },
  {
    title: "Peak Performance Inconsistency",
    description: "Brilliant one day, brain fog the next",
  },
  {
    title: '"Tried Everything" Frustration',
    description: "Elite strategies that work for everyone else fail you",
  },
];

export function HighPerformerTrapModal({
  open,
  onOpenChange,
  onOpenCalendly,
  onOpenAssessment,
  onOpenChallenge,
}: HighPerformerTrapModalProps) {
  const handleCalendlyClick = () => {
    onOpenChange(false);
    onOpenCalendly();
  };

  const handleAssessmentClick = () => {
    onOpenChange(false);
    onOpenAssessment?.();
  };

  const handleChallengeClick = () => {
    onOpenChange(false);
    onOpenChallenge?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card p-0">
        <DialogHeader className="p-6 pb-4 sticky top-0 bg-card z-10 border-b border-border">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">
            The High-Performer Trap <span className="gradient-athletic">Revealed</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm mt-2">
            Discover why elite strategies fail high-performers and how to break free.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-8">
          {/* Trap Items */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-1 gradient-electric" />
              <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                The High-Performer Trap
              </h3>
            </div>

            <div className="space-y-4">
              {TRAPS.map((trap, i) => (
                <div key={i} className="athletic-card p-5 pl-8 flex items-start gap-4">
                  <div className="p-2 bg-secondary flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-black uppercase tracking-wide mb-1">{trap.title}</h4>
                    <p className="text-sm font-bold text-muted-foreground">{trap.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Revelation Section */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-1 gradient-electric" />
              <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                The Revelation
              </h3>
            </div>

            <div className="athletic-card overflow-hidden">
              <div className="relative w-full aspect-[16/9]">
                <Image
                  src="/images/revelation-section.jpg"
                  alt="The revelation"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 pl-8">
                <h4 className="text-xl font-black uppercase tracking-tight mb-4">
                  You weren&apos;t designed for generic solutions.
                </h4>
                <p className="text-muted-foreground font-bold leading-relaxed mb-4">
                  Most executives aren&apos;t lacking ambition, discipline, or intelligence.
                </p>
                <p className="font-bold text-lg">
                  They&apos;re lacking a{" "}
                  <span className="gradient-athletic">METABOLIC OPERATING SYSTEM</span> designed for
                  their demands.
                </p>
              </div>
            </div>
          </section>

          {/* CTAs */}
          <section className="pt-4 border-t border-border">
            <h4 className="text-lg font-black uppercase tracking-tight mb-4 text-center">
              Ready to Break Free From the Trap?
            </h4>

            <div className="space-y-3">
              <button
                onClick={handleCalendlyClick}
                className="btn-athletic group w-full flex items-center justify-center gap-3 px-6 py-4 gradient-electric text-black glow-power"
              >
                Claim Your FREE Strategy Session
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={handleAssessmentClick}
                className="btn-athletic group w-full flex items-center justify-center gap-3 px-6 py-4 bg-secondary text-foreground"
              >
                <Target className="h-5 w-5 text-primary" />
                Take the Metabolic Assessment
              </button>

              <button
                onClick={handleChallengeClick}
                className="btn-athletic group w-full flex items-center justify-center gap-3 px-6 py-4 bg-secondary text-foreground"
              >
                <Trophy className="h-5 w-5 text-primary" />
                Start the 30-Day Challenge
              </button>
            </div>

            <p className="text-center text-xs font-bold text-muted-foreground mt-4">
              Choose your path to metabolic optimization
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
