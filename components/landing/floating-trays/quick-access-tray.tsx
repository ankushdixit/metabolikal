"use client";

import { useState } from "react";
import { ChevronRight, Trophy, Users, Sparkles, Award } from "lucide-react";

interface QuickAccessTrayProps {
  onOpenRealResults: () => void;
  onOpenMeetExpert: () => void;
  onOpenMethod: () => void;
  onOpenElitePrograms: () => void;
}

const QUICK_LINKS = [
  { id: "real-results", label: "Real Results", icon: Trophy },
  { id: "meet-expert", label: "Meet Expert", icon: Users },
  { id: "method", label: "The Method", icon: Sparkles },
  { id: "elite-programs", label: "Elite Programs", icon: Award },
] as const;

export function QuickAccessTray({
  onOpenRealResults,
  onOpenMeetExpert,
  onOpenMethod,
  onOpenElitePrograms,
}: QuickAccessTrayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLinkClick = (id: string) => {
    switch (id) {
      case "real-results":
        onOpenRealResults();
        break;
      case "meet-expert":
        onOpenMeetExpert();
        break;
      case "method":
        onOpenMethod();
        break;
      case "elite-programs":
        onOpenElitePrograms();
        break;
    }
    setIsExpanded(false);
  };

  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40 hidden md:block">
      <div
        className={`
          flex items-center transition-all duration-300 ease-in-out
          ${isExpanded ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Expanded Content */}
        <div className="bg-card border-r border-t border-b border-border shadow-lg">
          <div className="p-3 border-b border-border">
            <span className="text-xs font-black tracking-[0.15em] text-muted-foreground uppercase">
              Quick Access
            </span>
          </div>
          <div className="py-2">
            {QUICK_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors text-left"
              >
                <link.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold">{link.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            bg-card border border-border border-l-0 shadow-lg
            p-3 hover:bg-secondary transition-colors
          `}
          aria-label={isExpanded ? "Collapse quick access menu" : "Expand quick access menu"}
        >
          <ChevronRight
            className={`h-5 w-5 text-primary transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>
    </div>
  );
}
