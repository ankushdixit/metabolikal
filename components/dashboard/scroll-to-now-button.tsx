/**
 * Scroll To Now Button Component
 *
 * Floating action button that appears when the user has scrolled
 * away from the current time indicator. Tapping scrolls back to "now".
 * Features:
 * - Auto-shows/hides based on scroll position
 * - Smooth scroll animation
 * - Haptic feedback on tap
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface ScrollToNowButtonProps {
  /** Ref to the "now" indicator element */
  nowIndicatorRef: React.RefObject<HTMLElement | null>;
  /** Threshold in pixels to show the button */
  threshold?: number;
  /** Additional class name */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ScrollToNowButton({
  nowIndicatorRef,
  threshold = 200,
  className,
}: ScrollToNowButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [direction, setDirection] = useState<"up" | "down">("down");
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Check if "now" indicator is in view
  const checkVisibility = useCallback(() => {
    const element = nowIndicatorRef.current;
    if (!element) {
      setIsVisible(false);
      return;
    }

    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const headerOffset = 120; // Account for sticky header

    // Check if the element is within the visible viewport (with buffer)
    const isInView =
      rect.top >= headerOffset - threshold && rect.bottom <= windowHeight + threshold;

    setIsVisible(!isInView);

    // Determine scroll direction hint
    if (!isInView) {
      if (rect.top < headerOffset) {
        setDirection("up");
      } else {
        setDirection("down");
      }
    }
  }, [nowIndicatorRef, threshold]);

  // Set up intersection observer and scroll listener
  useEffect(() => {
    const element = nowIndicatorRef.current;
    if (!element) return;

    // Use IntersectionObserver for performance
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsVisible(!entry.isIntersecting);
          if (!entry.isIntersecting) {
            // Determine direction based on bounding rect
            const rect = entry.boundingClientRect;
            setDirection(rect.top < 0 ? "up" : "down");
          }
        }
      },
      {
        rootMargin: `-120px 0px -${threshold}px 0px`, // Account for header
        threshold: 0,
      }
    );

    observerRef.current.observe(element);

    // Initial check
    checkVisibility();

    // Also listen to scroll for edge cases
    const handleScroll = () => {
      requestAnimationFrame(checkVisibility);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [nowIndicatorRef, threshold, checkVisibility]);

  // Handle scroll to now
  const handleScrollToNow = useCallback(() => {
    const element = nowIndicatorRef.current;
    if (!element) return;

    // Haptic feedback
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }

    // Scroll with offset for header
    const headerOffset = 140;
    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = elementPosition - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }, [nowIndicatorRef]);

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <button
      onClick={handleScrollToNow}
      className={cn(
        // Positioning - bottom right, above safe area
        "fixed right-4 bottom-24 z-40",
        // Sizing - large touch target
        "min-w-[48px] min-h-[48px] p-3",
        // Styling
        "flex items-center gap-2",
        "bg-primary text-primary-foreground",
        "rounded-full shadow-lg",
        // Animation
        "animate-in fade-in-0 zoom-in-95 duration-200",
        "active:scale-95 transition-transform",
        className
      )}
      aria-label="Scroll to current time"
    >
      <Clock className="h-5 w-5" />
      <span className="text-sm font-bold pr-1">{direction === "up" ? "↑" : "↓"} Now</span>
    </button>
  );
}
