"use client";

import Link from "next/link";
import { Utensils, Dumbbell, ClipboardList, Plus, ChevronRight } from "lucide-react";

interface QuickActionsProps {
  onLogFood: () => void;
}

/**
 * Quick actions component
 * Provides quick navigation buttons for common dashboard actions
 * Athletic-styled to match landing page design
 */
export function QuickActions({ onLogFood }: QuickActionsProps) {
  const actions = [
    {
      label: "View Today's Meals",
      href: "/dashboard/diet",
      icon: Utensils,
      description: "Check your meal plan",
    },
    {
      label: "View Today's Workout",
      href: "/dashboard/workout",
      icon: Dumbbell,
      description: "See your exercises",
    },
    {
      label: "Submit Check-In",
      href: "/dashboard/checkin",
      icon: ClipboardList,
      description: "Log your progress",
    },
  ];

  return (
    <div className="athletic-card p-6 pl-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-1 gradient-electric" />
        <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
          Quick Actions
        </h3>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Log Food - Primary Action */}
        <button
          onClick={onLogFood}
          className="btn-athletic w-full flex items-center justify-between px-5 py-4 gradient-electric text-black glow-power group"
        >
          <div className="flex items-center gap-3">
            <Plus className="h-5 w-5" />
            <span>Log Food</span>
          </div>
          <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>

        {/* Navigation Actions */}
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="btn-athletic w-full flex items-center justify-between px-5 py-4 bg-secondary text-foreground group"
          >
            <div className="flex items-center gap-3">
              <action.icon className="h-5 w-5 text-primary" />
              <div className="text-left">
                <span className="block">{action.label}</span>
                <span className="block text-xs font-bold text-muted-foreground normal-case tracking-normal">
                  {action.description}
                </span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </div>
  );
}
