"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Briefcase, Rocket, Globe, TrendingUp, Users, Sparkles, ChevronRight } from "lucide-react";

interface EliteLifestylesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenCalendly: () => void;
}

const LIFESTYLES = [
  {
    icon: Briefcase,
    title: "C-Suite Executives",
    description: "Where 9-5 isn't even a concept—just meetings, leadership, and perpetual demands.",
    highlighted: false,
  },
  {
    icon: Rocket,
    title: "High-Performance Entrepreneurs",
    description: "Who answer to no one but their vision and performance metrics.",
    highlighted: false,
  },
  {
    icon: Globe,
    title: "Global Professionals",
    description: "Where 6 countries in 8 weeks means metabolic chaos—not boundaries.",
    highlighted: false,
  },
  {
    icon: TrendingUp,
    title: "Elite Performers",
    description: "Who live to scale peak performance, not survive the hamster wheel.",
    highlighted: false,
  },
  {
    icon: Users,
    title: "Professionals",
    description: "Whose demanding careers require metabolic excellence.",
    highlighted: false,
  },
  {
    icon: Sparkles,
    title: "NOW YOU!!",
    description: "Ready for your transformation?",
    highlighted: true,
  },
];

export function EliteLifestylesModal({
  open,
  onOpenChange,
  onOpenCalendly,
}: EliteLifestylesModalProps) {
  const handleCalendlyClick = () => {
    onOpenChange(false);
    onOpenCalendly();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card p-0">
        <DialogHeader className="p-6 pb-4 sticky top-0 bg-card z-10 border-b border-border">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">
            We Understand <span className="gradient-athletic">Your Lifestyle</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm mt-2">
            Elite coaching designed for demanding professional lifestyles.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-8">
          {/* Lifestyle Cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {LIFESTYLES.map((lifestyle, i) => (
              <div
                key={i}
                className={`athletic-card p-6 pl-8 transition-all ${
                  lifestyle.highlighted ? "glow-power border-primary/50" : "hover:glow-power"
                }`}
              >
                <div
                  className={`p-3 w-fit mb-4 ${
                    lifestyle.highlighted ? "gradient-electric" : "bg-secondary"
                  }`}
                >
                  <lifestyle.icon
                    className={`h-6 w-6 ${lifestyle.highlighted ? "text-black" : "text-primary"}`}
                  />
                </div>
                <h4
                  className={`font-black uppercase tracking-wide mb-2 ${
                    lifestyle.highlighted ? "text-xl gradient-athletic" : "text-base"
                  }`}
                >
                  {lifestyle.title}
                </h4>
                <p
                  className={`text-sm font-bold ${
                    lifestyle.highlighted ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {lifestyle.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="pt-4 border-t border-border">
            <button
              onClick={handleCalendlyClick}
              className="btn-athletic group w-full flex items-center justify-center gap-3 px-8 py-5 gradient-electric text-black glow-power"
            >
              Claim Your FREE Strategy Session
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
