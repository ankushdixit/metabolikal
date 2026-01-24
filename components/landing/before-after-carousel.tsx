"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TRANSFORMATIONS } from "@/lib/data/transformations";

interface BeforeAfterCarouselProps {
  /** Custom class name for the container */
  className?: string;
  /** Auto-advance interval in milliseconds (0 to disable) */
  autoAdvanceInterval?: number;
}

export function BeforeAfterCarousel({
  className = "",
  autoAdvanceInterval = 0,
}: BeforeAfterCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const totalSlides = TRANSFORMATIONS.length;

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  }, [totalSlides]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  }, [totalSlides]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext]);

  // Auto-advance
  useEffect(() => {
    if (autoAdvanceInterval <= 0) return;

    const interval = setInterval(() => {
      goToNext();
    }, autoAdvanceInterval);

    return () => clearInterval(interval);
  }, [autoAdvanceInterval, goToNext]);

  const currentTransformation = TRANSFORMATIONS[currentIndex];

  const handleImageError = (imageKey: string) => {
    setImageErrors((prev) => ({ ...prev, [imageKey]: true }));
  };

  return (
    <div
      className={`relative ${className}`}
      role="region"
      aria-label="Before and after transformation gallery"
      aria-roledescription="carousel"
    >
      {/* Main Carousel Content */}
      <div className="relative">
        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-0 sm:-left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-secondary/90 backdrop-blur-sm rounded-full border border-border shadow-lg hover:bg-secondary hover:scale-110 transition-all"
          aria-label="Previous transformation"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-0 sm:-right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-secondary/90 backdrop-blur-sm rounded-full border border-border shadow-lg hover:bg-secondary hover:scale-110 transition-all"
          aria-label="Next transformation"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Transformation Card */}
        <div
          className="px-8 sm:px-12"
          role="group"
          aria-roledescription="slide"
          aria-label={`Transformation ${currentIndex + 1} of ${totalSlides}: ${currentTransformation.clientName}`}
        >
          <div className="athletic-card p-4 sm:p-6">
            {/* Before/After Images */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
              {/* Before Image */}
              <div className="relative">
                <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-black/70 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider rounded">
                  Before
                </div>
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary">
                  {!imageErrors[`${currentTransformation.id}-before`] ? (
                    <Image
                      src={currentTransformation.beforeImage}
                      alt={`${currentTransformation.clientName} before transformation`}
                      fill
                      className="object-cover grayscale-[30%]"
                      onError={() => handleImageError(`${currentTransformation.id}-before`)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center p-4">
                        <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-2xl">👤</span>
                        </div>
                        <span className="text-xs">Before</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* After Image */}
              <div className="relative">
                <div className="absolute top-2 left-2 z-10 px-2 py-1 gradient-electric text-black text-[10px] sm:text-xs font-black uppercase tracking-wider rounded">
                  After
                </div>
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary ring-2 ring-primary/20">
                  {!imageErrors[`${currentTransformation.id}-after`] ? (
                    <Image
                      src={currentTransformation.afterImage}
                      alt={`${currentTransformation.clientName} after transformation`}
                      fill
                      className="object-cover"
                      onError={() => handleImageError(`${currentTransformation.id}-after`)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center p-4">
                        <div className="w-16 h-16 mx-auto mb-2 rounded-full gradient-electric flex items-center justify-center">
                          <span className="text-2xl">💪</span>
                        </div>
                        <span className="text-xs">After</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="text-center">
              <h4 className="font-black text-lg uppercase tracking-wide mb-1">
                {currentTransformation.clientName}
              </h4>
              <p className="text-muted-foreground font-bold text-sm mb-2">
                &ldquo;{currentTransformation.result}&rdquo;
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 bg-secondary rounded font-bold">
                  {currentTransformation.duration}
                </span>
                <span>•</span>
                <span className="px-2 py-1 bg-secondary rounded font-bold">
                  {currentTransformation.profession}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dot Indicators */}
      <div
        className="flex items-center justify-center gap-2 mt-4"
        role="tablist"
        aria-label="Transformation slides"
      >
        {TRANSFORMATIONS.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            role="tab"
            aria-selected={index === currentIndex}
            aria-label={`Go to transformation ${index + 1}`}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              index === currentIndex
                ? "bg-primary w-6"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
          />
        ))}
      </div>

      {/* Slide Counter (for screen readers) */}
      <div className="sr-only" aria-live="polite">
        Showing transformation {currentIndex + 1} of {totalSlides}
      </div>
    </div>
  );
}
