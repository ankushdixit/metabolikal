"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface BodyFatGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Props destructured - open is passed to Dialog

const MEN_RANGES = [
  {
    range: "5-9%",
    category: "Essential",
    description:
      "Extremely lean, visible striations, minimal fat. Typical for competitive bodybuilders during peak.",
  },
  {
    range: "10-14%",
    category: "Athletic",
    description:
      "Clear muscle definition, visible abs, athletic appearance. Typical for fitness models and athletes.",
  },
  {
    range: "15-19%",
    category: "Fitness",
    description:
      "Good muscle tone, some ab definition, healthy appearance. Typical for active individuals.",
  },
  {
    range: "20-24%",
    category: "Average",
    description: "Less muscle definition, some visible softness, typical for general population.",
  },
  {
    range: "25%+",
    category: "Elevated",
    description: "Significant fat storage, reduced muscle visibility, higher health risk category.",
  },
];

const WOMEN_RANGES = [
  {
    range: "10-14%",
    category: "Essential",
    description:
      "Extremely lean, visible muscle striations, minimal curves. Typical for competitive athletes.",
  },
  {
    range: "15-19%",
    category: "Athletic",
    description:
      "Toned appearance, visible muscle definition, athletic curves. Typical for fitness competitors.",
  },
  {
    range: "20-24%",
    category: "Fitness",
    description: "Healthy curves, good muscle tone, fit appearance. Optimal for most active women.",
  },
  {
    range: "25-31%",
    category: "Average",
    description: "Natural curves, softer appearance, typical for general population.",
  },
  {
    range: "32%+",
    category: "Elevated",
    description: "Significant fat storage, reduced muscle definition, higher health risk category.",
  },
];

const ESTIMATION_TIPS = [
  {
    indicator: "Visible Abs",
    description: "Generally indicates 10-15% (men) or 15-20% (women)",
  },
  {
    indicator: "Muscle Definition",
    description: "Clear muscle separation suggests 12-18% (men) or 18-24% (women)",
  },
  {
    indicator: "Soft Appearance",
    description: "Minimal muscle visibility suggests 20%+ (men) or 30%+ (women)",
  },
  {
    indicator: "Not Sure?",
    description: "Leave it blank - our calculator will still provide accurate metabolic insights",
  },
];

export function BodyFatGuideModal({ open, onOpenChange }: BodyFatGuideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-card p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-4 bg-card border-b border-border flex-shrink-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">
            Body Fat Percentage <span className="gradient-athletic">Guide</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm mt-2">
            Use this visual guide to estimate your body fat percentage. Remember, this is just an
            estimate - professional assessment methods like DEXA scans or BodPod are more accurate.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
            {/* Men's Ranges */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-1 gradient-electric" />
                <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                  Men&apos;s Body Fat % Ranges
                </h3>
              </div>

              <div className="space-y-3">
                {MEN_RANGES.map((item) => (
                  <div key={item.range} className="athletic-card p-4 pl-8 flex gap-4">
                    <div className="flex-shrink-0 w-20">
                      <span className="text-lg font-black text-primary">{item.range}</span>
                      <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-muted-foreground flex-1">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Women's Ranges */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-1 gradient-electric" />
                <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                  Women&apos;s Body Fat % Ranges
                </h3>
              </div>

              <div className="space-y-3">
                {WOMEN_RANGES.map((item) => (
                  <div key={item.range} className="athletic-card p-4 pl-8 flex gap-4">
                    <div className="flex-shrink-0 w-20">
                      <span className="text-lg font-black text-primary">{item.range}</span>
                      <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-muted-foreground flex-1">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Estimation Tips */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-1 gradient-electric" />
                <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                  Quick Estimation Tips
                </h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {ESTIMATION_TIPS.map((tip) => (
                  <div key={tip.indicator} className="athletic-card p-4 pl-8">
                    <h4 className="font-black uppercase tracking-wide text-sm mb-1">
                      {tip.indicator}
                    </h4>
                    <p className="text-sm font-bold text-muted-foreground">{tip.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Close Button */}
            <div className="pt-4 border-t border-border">
              <button
                onClick={() => onOpenChange(false)}
                className="btn-athletic w-full px-6 py-4 bg-secondary text-foreground"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
