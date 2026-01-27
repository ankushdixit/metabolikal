/**
 * Timeline Swipe Container Component
 *
 * Wraps timeline content with swipe gesture detection for day navigation.
 * Features:
 * - Visual feedback during swipe (day preview)
 * - Smooth transition animations
 * - Direction indicators
 * - Touch-optimized gestures
 */

"use client";

import { useCallback, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";

// =============================================================================
// TYPES
// =============================================================================

interface TimelineSwipeContainerProps {
  /** Content to render */
  children: ReactNode;
  /** Handler for previous day navigation */
  onPreviousDay: () => void;
  /** Handler for next day navigation */
  onNextDay: () => void;
  /** Whether can navigate to previous day */
  canGoPrevious: boolean;
  /** Whether can navigate to next day */
  canGoNext: boolean;
  /** Label for previous day (shown during swipe) */
  previousDayLabel?: string;
  /** Label for next day (shown during swipe) */
  nextDayLabel?: string;
  /** Whether the container is enabled */
  enabled?: boolean;
  /** Additional class name */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function TimelineSwipeContainer({
  children,
  onPreviousDay,
  onNextDay,
  canGoPrevious,
  canGoNext,
  previousDayLabel = "Previous",
  nextDayLabel = "Next",
  enabled = true,
  className,
}: TimelineSwipeContainerProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Handle navigation with transition
  const handleSwipeLeft = useCallback(() => {
    if (!canGoNext) return;
    setIsTransitioning(true);
    onNextDay();
    // Reset transition state after animation
    setTimeout(() => setIsTransitioning(false), 300);
  }, [canGoNext, onNextDay]);

  const handleSwipeRight = useCallback(() => {
    if (!canGoPrevious) return;
    setIsTransitioning(true);
    onPreviousDay();
    // Reset transition state after animation
    setTimeout(() => setIsTransitioning(false), 300);
  }, [canGoPrevious, onPreviousDay]);

  const { handlers, swipeProgress, isSwiping, swipeDirection, thresholdReached } =
    useSwipeNavigation({
      onSwipeLeft: handleSwipeLeft,
      onSwipeRight: handleSwipeRight,
      canSwipeLeft: canGoNext,
      canSwipeRight: canGoPrevious,
      threshold: 0.3,
      enableHaptics: true,
    });

  // Calculate visual transform based on swipe progress
  const translateX = enabled && isSwiping ? swipeProgress * 50 : 0; // Max 50px offset

  // Don't apply swipe handlers if disabled
  const touchHandlers = enabled ? handlers : {};

  return (
    <div className={cn("relative overflow-hidden", className)} {...touchHandlers}>
      {/* Left edge indicator (swiping right = previous day) */}
      {enabled && isSwiping && swipeDirection === "right" && canGoPrevious && (
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 z-10",
            "flex items-center justify-start pl-2",
            "pointer-events-none",
            "transition-opacity duration-150",
            thresholdReached ? "opacity-100" : "opacity-50"
          )}
          style={{ width: `${Math.abs(swipeProgress) * 80}px` }}
        >
          <div
            className={cn(
              "flex items-center gap-1 px-3 py-2 rounded-r-lg",
              "bg-primary/20 border-r-2",
              thresholdReached ? "border-primary" : "border-primary/50"
            )}
          >
            <ChevronLeft
              className={cn(
                "h-5 w-5 transition-colors",
                thresholdReached ? "text-primary" : "text-primary/70"
              )}
            />
            <span
              className={cn(
                "text-sm font-bold transition-colors",
                thresholdReached ? "text-primary" : "text-primary/70"
              )}
            >
              {previousDayLabel}
            </span>
          </div>
        </div>
      )}

      {/* Right edge indicator (swiping left = next day) */}
      {enabled && isSwiping && swipeDirection === "left" && canGoNext && (
        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 z-10",
            "flex items-center justify-end pr-2",
            "pointer-events-none",
            "transition-opacity duration-150",
            thresholdReached ? "opacity-100" : "opacity-50"
          )}
          style={{ width: `${Math.abs(swipeProgress) * 80}px` }}
        >
          <div
            className={cn(
              "flex items-center gap-1 px-3 py-2 rounded-l-lg",
              "bg-primary/20 border-l-2",
              thresholdReached ? "border-primary" : "border-primary/50"
            )}
          >
            <span
              className={cn(
                "text-sm font-bold transition-colors",
                thresholdReached ? "text-primary" : "text-primary/70"
              )}
            >
              {nextDayLabel}
            </span>
            <ChevronRight
              className={cn(
                "h-5 w-5 transition-colors",
                thresholdReached ? "text-primary" : "text-primary/70"
              )}
            />
          </div>
        </div>
      )}

      {/* Resistance indicator (swiping in blocked direction) */}
      {enabled && isSwiping && swipeDirection === "right" && !canGoPrevious && (
        <div
          className="absolute left-0 top-0 bottom-0 z-10 flex items-center justify-start pl-3 pointer-events-none"
          style={{ width: `${Math.abs(swipeProgress) * 40}px`, opacity: Math.abs(swipeProgress) }}
        >
          <div className="w-1 h-16 bg-muted-foreground/30 rounded-full" />
        </div>
      )}

      {enabled && isSwiping && swipeDirection === "left" && !canGoNext && (
        <div
          className="absolute right-0 top-0 bottom-0 z-10 flex items-center justify-end pr-3 pointer-events-none"
          style={{ width: `${Math.abs(swipeProgress) * 40}px`, opacity: Math.abs(swipeProgress) }}
        >
          <div className="w-1 h-16 bg-muted-foreground/30 rounded-full" />
        </div>
      )}

      {/* Content with transform */}
      <div
        className={cn(
          "transition-transform",
          isTransitioning ? "duration-300 ease-out" : isSwiping ? "duration-0" : "duration-200"
        )}
        style={{
          transform: `translateX(${translateX}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
