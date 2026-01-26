/**
 * Application Constants
 *
 * Central configuration for feature flags and application settings.
 */

// =============================================================================
// Admin Settings
// =============================================================================

/**
 * Number of items to display per page in admin tables.
 * Used across all admin list pages for consistent pagination.
 */
export const ADMIN_PAGE_SIZE = 10;

/**
 * Hero section variant type.
 * - 'A': Problem-Solution Focus - Addresses visitor's frustration, positions Metabolikal as solution
 * - 'B': Results/Transformation Focus - Leads with specific, measurable outcomes
 * - 'C': Identity/Positioning Focus - Creates self-identification for target audience
 * - 'original': Original quote-based hero section
 */
export type HeroVariant = "A" | "B" | "C" | "original";

/**
 * Current active hero variant for A/B testing.
 *
 * To change the active variant:
 * 1. Update this value to 'A', 'B', 'C', or 'original'
 * 2. The landing page will automatically render the selected variant
 *
 * For production A/B testing, consider using:
 * - Environment variables: process.env.NEXT_PUBLIC_HERO_VARIANT
 * - Feature flag services (LaunchDarkly, Flagsmith, etc.)
 * - Cookie/localStorage based variant assignment
 */
export const ACTIVE_HERO_VARIANT: HeroVariant =
  (process.env.NEXT_PUBLIC_HERO_VARIANT as HeroVariant) || "C";

/**
 * Hero variant configuration metadata.
 * Used for analytics tracking and variant selection logic.
 */
export const HERO_VARIANTS: Record<
  HeroVariant,
  {
    name: string;
    description: string;
    focus: string;
  }
> = {
  A: {
    name: "Problem-Solution",
    description: "Lead with the problem busy professionals face, then position as solution",
    focus: "Validates frustration before offering hope",
  },
  B: {
    name: "Results-Focused",
    description: "Lead with specific, measurable outcomes that high-performers care about",
    focus: "Concrete numbers and results for immediate credibility",
  },
  C: {
    name: "Identity-Positioning",
    description: "Lead with who this is for, creating immediate self-identification",
    focus: "Aspirational elite positioning for target audience",
  },
  original: {
    name: "Original Quote",
    description: "Founder quote with metabolic transformation messaging",
    focus: "Intriguing quote that sparks curiosity",
  },
};
