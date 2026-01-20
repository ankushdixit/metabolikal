"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Trophy,
  Footprints,
  Droplets,
  Building2,
  Beef,
  Moon,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  Flame,
  Target,
  Calendar,
  Award,
  TrendingUp,
  Zap,
} from "lucide-react";

interface UserGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLaunchChallenge: () => void;
}

const CHALLENGE_STEPS = [
  {
    number: 1,
    title: "Start Your Challenge",
    description:
      "Open the Challenge Hub and complete your first daily check-in. Your 30-day journey begins the moment you log your first day.",
  },
  {
    number: 2,
    title: "Track Daily Metrics",
    description:
      "Log your steps, water intake, floors climbed, protein consumption, and sleep hours. Each metric earns you points based on achievement tiers.",
  },
  {
    number: 3,
    title: "Build Your Streak",
    description:
      "Consecutive days of logging build your streak. Streaks unlock bonus recognition and keep you motivated throughout the challenge.",
  },
  {
    number: 4,
    title: "Unlock New Weeks",
    description:
      "Complete at least 6 out of 7 days (90%) in a week to unlock the next week. This progressive system ensures consistent engagement.",
  },
  {
    number: 5,
    title: "Reach Your Goals",
    description:
      "Track your cumulative progress, earn points, and watch your metabolic health score improve over the 30-day challenge period.",
  },
];

const POINTS_TABLE = [
  {
    metric: "Steps",
    icon: Footprints,
    tiers: [
      { target: "7,000", points: 15 },
      { target: "10,000", points: 30 },
      { target: "15,000+", points: 45 },
    ],
  },
  {
    metric: "Water",
    icon: Droplets,
    tiers: [{ target: "3.0L+", points: 15 }],
  },
  {
    metric: "Floors",
    icon: Building2,
    tiers: [
      { target: "4", points: 15 },
      { target: "14+", points: 45 },
    ],
  },
  {
    metric: "Protein",
    icon: Beef,
    tiers: [{ target: "70g+", points: 15 }],
  },
  {
    metric: "Sleep",
    icon: Moon,
    tiers: [{ target: "7h+", points: 15 }],
  },
  {
    metric: "Check-in",
    icon: CheckCircle2,
    tiers: [{ target: "Daily Save", points: 15 }],
  },
];

const KEY_FEATURES = [
  {
    icon: Calendar,
    title: "30-Day Calendar View",
    description:
      "Visual progress tracker showing completed days, current day, and locked future weeks.",
  },
  {
    icon: Trophy,
    title: "Points System",
    description: "Earn up to 150 points daily across 5 health metrics plus check-in bonus.",
  },
  {
    icon: TrendingUp,
    title: "Progressive Week Unlocking",
    description: "Complete 90% of days in a week to unlock the next week's tracking.",
  },
  {
    icon: Flame,
    title: "Streak Tracking",
    description: "Build consecutive day streaks to maintain momentum and motivation.",
  },
  {
    icon: Target,
    title: "Cumulative Stats",
    description: "Track your total steps, water intake, and other metrics over the challenge.",
  },
  {
    icon: Award,
    title: "Completion Recognition",
    description: "Visual badges and completion percentage to celebrate your progress.",
  },
];

const TIPS_FOR_SUCCESS = [
  "Log your metrics at the same time each day to build a habit",
  "Start with achievable goals and increase gradually",
  "Use the progressive targets (10% increases) to guide improvement",
  "Don't worry about perfect days - consistency beats perfection",
  "Review your Journey tab weekly to celebrate progress",
  "Set reminders on your phone for daily check-ins",
  "Focus on improving one metric at a time if feeling overwhelmed",
];

export function UserGuideModal({ open, onOpenChange, onLaunchChallenge }: UserGuideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-card p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-4 bg-card border-b border-border flex-shrink-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">
            How the <span className="gradient-athletic">30-Day Challenge</span> Works
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm mt-2">
            Your Complete Guide to Metabolic Transformation
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
            {/* Welcome Message */}
            <div className="athletic-card p-6 pl-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-secondary flex-shrink-0">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight mb-2">
                    Welcome to the 30-Day METABOLI-K-AL Challenge!
                  </h3>
                  <p className="text-muted-foreground font-bold text-sm leading-relaxed">
                    This challenge is designed to help you build sustainable metabolic health habits
                    through daily tracking, gamification, and progressive goals. Track your key
                    metrics, earn points, and watch your health transform over 30 days.
                  </p>
                </div>
              </div>
            </div>

            {/* Challenge Steps */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-1 gradient-electric" />
                <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                  How It Works
                </h3>
              </div>

              <div className="space-y-4">
                {CHALLENGE_STEPS.map((step) => (
                  <div key={step.number} className="athletic-card p-5 pl-8">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-secondary flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-black text-primary">{step.number}</span>
                      </div>
                      <div>
                        <h4 className="font-black uppercase tracking-wide mb-1">{step.title}</h4>
                        <p className="text-sm text-muted-foreground font-bold leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Points Table */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-1 gradient-electric" />
                <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                  Points System
                </h3>
              </div>

              <div className="athletic-card p-6 pl-8">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 text-xs font-black tracking-wider text-muted-foreground uppercase">
                          Metric
                        </th>
                        <th className="text-left py-3 text-xs font-black tracking-wider text-muted-foreground uppercase">
                          Target
                        </th>
                        <th className="text-right py-3 text-xs font-black tracking-wider text-muted-foreground uppercase">
                          Points
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {POINTS_TABLE.map((item) =>
                        item.tiers.map((tier, tierIndex) => (
                          <tr
                            key={`${item.metric}-${tierIndex}`}
                            className="border-b border-border/50 last:border-0"
                          >
                            <td className="py-3">
                              {tierIndex === 0 && (
                                <div className="flex items-center gap-2">
                                  <item.icon className="h-4 w-4 text-primary" />
                                  <span className="font-bold text-sm">{item.metric}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-3 text-sm text-muted-foreground font-bold">
                              {tier.target}
                            </td>
                            <td className="py-3 text-right">
                              <span className="px-2 py-1 bg-secondary text-primary font-black text-sm">
                                {tier.points} pts
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-sm font-black uppercase tracking-wide">Maximum Daily</span>
                  <span className="px-4 py-2 gradient-electric text-black font-black">150 pts</span>
                </div>
              </div>
            </section>

            {/* Key Features */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-1 gradient-electric" />
                <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                  Key Features
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {KEY_FEATURES.map((feature, i) => (
                  <div key={i} className="athletic-card p-5 pl-8 hover:glow-power transition-all">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-secondary flex-shrink-0">
                        <feature.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-black uppercase tracking-wide text-sm mb-1">
                          {feature.title}
                        </h4>
                        <p className="text-xs text-muted-foreground font-bold leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Tips for Success */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-1 gradient-electric" />
                <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                  7 Tips for Success
                </h3>
              </div>

              <div className="athletic-card p-6 pl-8">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-secondary flex-shrink-0">
                    <Lightbulb className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground font-bold">
                    Follow these tips to maximize your chances of completing the 30-day challenge:
                  </p>
                </div>

                <ul className="space-y-3">
                  {TIPS_FOR_SUCCESS.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-black text-primary">{i + 1}</span>
                      </div>
                      <span className="text-sm font-bold text-muted-foreground">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* CTA */}
            <div className="text-center pt-4">
              <button
                onClick={onLaunchChallenge}
                className="btn-athletic group inline-flex items-center gap-3 px-8 py-5 gradient-electric text-black glow-power"
              >
                <Zap className="h-5 w-5" />
                Launch Challenge Hub Now
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
