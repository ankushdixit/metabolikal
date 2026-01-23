"use client";

import { LucideIcon } from "lucide-react";

interface HeroCTAProps {
  /** Button label text */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Optional icon component */
  icon?: LucideIcon;
  /** Button style variant */
  variant?: "primary" | "secondary";
  /** Show right arrow/chevron */
  showArrow?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Accessibility label */
  ariaLabel?: string;
}

/**
 * Shared CTA button component for hero sections.
 * Provides consistent button styling across all hero variants.
 */
export function HeroCTA({
  label,
  onClick,
  icon: Icon,
  variant = "primary",
  showArrow = false,
  className = "",
  ariaLabel,
}: HeroCTAProps) {
  const baseClasses = "btn-athletic group flex items-center justify-center gap-3 px-8 py-5";

  const variantClasses = {
    primary: "gradient-electric text-black glow-power",
    secondary: "bg-secondary text-foreground",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      aria-label={ariaLabel || label}
    >
      {Icon && (
        <Icon
          className={`h-5 w-5 ${variant === "secondary" ? "text-primary" : ""}`}
          aria-hidden="true"
        />
      )}
      {label}
      {showArrow && (
        <svg
          className="h-5 w-5 transition-transform group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
}
