"use client";

interface HeroBackgroundProps {
  /** Background variant style */
  variant?: "default" | "darker" | "centered";
  /** Additional CSS classes */
  className?: string;
}

/**
 * Shared hero section background component with angled athletic styling.
 * Provides consistent background treatment across all hero variants.
 */
export function HeroBackground({ variant = "default", className = "" }: HeroBackgroundProps) {
  const gradientClasses = {
    default: "w-2/3 bg-gradient-to-bl from-primary/10 via-transparent to-transparent",
    darker: "w-2/3 bg-gradient-to-bl from-primary/5 via-transparent to-transparent",
    centered: "w-full bg-gradient-to-b from-primary/8 via-transparent to-transparent",
  };

  return (
    <>
      {/* Diagonal stripes pattern */}
      <div className="absolute inset-0 diagonal-stripes pointer-events-none" />

      {/* Angled accent background */}
      <div
        className={`absolute top-0 right-0 h-full skew-x-12 origin-top-right pointer-events-none ${gradientClasses[variant]} ${className}`}
        aria-hidden="true"
      />
    </>
  );
}
