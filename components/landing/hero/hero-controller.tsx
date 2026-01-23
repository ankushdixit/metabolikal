"use client";

import { ACTIVE_HERO_VARIANT, type HeroVariant } from "@/lib/constants";
import { HeroVariantA } from "./hero-variant-a";
import { HeroVariantB } from "./hero-variant-b";
import { HeroVariantC } from "./hero-variant-c";
import { HeroOriginal } from "./hero-original";

interface HeroControllerProps {
  /** Optional variant override (useful for testing/preview) */
  variant?: HeroVariant;
  /** Handler for opening Calendly modal */
  onOpenCalendly: () => void;
  /** Handler for opening Assessment modal */
  onOpenAssessment: () => void;
  /** Handler for opening Real Results modal */
  onOpenRealResults: () => void;
  /** Handler for opening Method modal */
  onOpenMethod: () => void;
  /** Handler for opening Challenge section link */
  onOpenChallengeHub: () => void;
}

/**
 * Hero Section Controller
 *
 * Renders the appropriate hero variant based on configuration.
 * Supports A/B testing by easily swapping variants via environment
 * variable or direct prop override.
 *
 * @example
 * // Uses configured variant (default)
 * <HeroController onOpenCalendly={...} onOpenAssessment={...} />
 *
 * @example
 * // Override with specific variant for preview
 * <HeroController variant="B" onOpenCalendly={...} onOpenAssessment={...} />
 */
export function HeroController({
  variant = ACTIVE_HERO_VARIANT,
  onOpenCalendly,
  onOpenAssessment,
  onOpenRealResults,
  onOpenMethod,
  onOpenChallengeHub,
}: HeroControllerProps) {
  switch (variant) {
    case "A":
      return <HeroVariantA onOpenCalendly={onOpenCalendly} onOpenAssessment={onOpenAssessment} />;
    case "B":
      return <HeroVariantB onOpenCalendly={onOpenCalendly} onOpenRealResults={onOpenRealResults} />;
    case "C":
      return <HeroVariantC onOpenCalendly={onOpenCalendly} onOpenMethod={onOpenMethod} />;
    case "original":
    default:
      return (
        <HeroOriginal
          onOpenCalendly={onOpenCalendly}
          onOpenAssessment={onOpenAssessment}
          onOpenChallengeHub={onOpenChallengeHub}
        />
      );
  }
}
