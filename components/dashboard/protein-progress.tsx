"use client";

import { Dumbbell, Trophy, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProteinProgressProps {
  consumed: number;
  target: number;
}

/**
 * Protein progress card component
 * Displays protein consumed vs target with gamified messages
 * Athletic-styled to match landing page design
 */
export function ProteinProgress({ consumed, target }: ProteinProgressProps) {
  const percentage = target > 0 ? Math.round((consumed / target) * 100) : 0;
  const displayPercentage = Math.min(percentage, 100);

  // Gamified messages based on progress
  const getMessage = () => {
    if (percentage >= 100) {
      return { text: "Protein goal crushed!", icon: Trophy, color: "text-primary" };
    }
    if (percentage >= 80) {
      return { text: "Almost at your goal!", icon: Target, color: "text-yellow-500" };
    }
    if (percentage >= 50) {
      return { text: "Great progress! Almost there.", icon: Zap, color: "text-power-blue" };
    }
    return { text: "Keep going! You've got this.", icon: Dumbbell, color: "text-muted-foreground" };
  };

  const messageData = getMessage();
  const MessageIcon = messageData.icon;

  return (
    <div className="athletic-card p-6 pl-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-secondary">
            <Dumbbell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">Protein</h3>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Daily intake
            </span>
          </div>
        </div>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Today
        </span>
      </div>

      {/* Main Numbers */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-black">{consumed}</span>
          <span className="text-lg font-bold text-muted-foreground">/ {target}g</span>
        </div>
        <p className="text-2xl font-black gradient-athletic">{percentage}%</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-3 bg-secondary overflow-hidden">
          <div
            className="h-full gradient-electric transition-all duration-500"
            style={{ width: `${displayPercentage}%` }}
          />
        </div>
      </div>

      {/* Gamified Message */}
      <div className="athletic-card p-4 pl-6 bg-secondary/50">
        <div className="flex items-center gap-3">
          <MessageIcon className={cn("h-5 w-5", messageData.color)} />
          <p className={cn("text-sm font-bold", messageData.color)}>{messageData.text}</p>
        </div>
      </div>
    </div>
  );
}
