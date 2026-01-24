"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface YouTubeVideo {
  id: string;
  title: string;
  isLandscape?: boolean;
}

const YOUTUBE_SHORTS: YouTubeVideo[] = [
  { id: "GKbzoiKoQzM", title: "Client Transformation Story" },
  { id: "QutRfBc9jM8", title: "Client Transformation Story" },
  { id: "FASef8aqdfM", title: "Client Transformation Story" },
  { id: "js1TlePCC7k", title: "Client Transformation Story" },
  { id: "bCTPI9SvZC0", title: "Client Transformation Story" },
  { id: "BTOZPZZi5Dk", title: "Client Transformation Story" },
  { id: "JiI63Walf4g", title: "Client Transformation Story" },
  { id: "4YWgnJoAH9w", title: "Client Transformation Story" },
  { id: "KVeFo0IoBA8", title: "Client Transformation Story" },
  { id: "kyxYUoQRE2M", title: "Client Transformation Story" },
  { id: "uDpy1Gh8bjs", title: "Client Transformation Story" },
  { id: "mfPiQjgGzbo", title: "Client Transformation Story" },
];

const YOUTUBE_TESTIMONIALS: YouTubeVideo[] = [
  { id: "K-HAAkZ1MzI", title: "Client Testimonial", isLandscape: true },
  { id: "KKejfj9_ZIA", title: "Client Testimonial", isLandscape: true },
  { id: "qsTew1fhnPY", title: "Client Testimonial", isLandscape: true },
];

// Combined array with shorts first, then testimonials
const ALL_VIDEOS: YouTubeVideo[] = [...YOUTUBE_SHORTS, ...YOUTUBE_TESTIMONIALS];

interface YouTubeShortsCarouselProps {
  /** Whether to show navigation arrows (default: true on desktop) */
  showArrows?: boolean;
  /** Custom class name for the container */
  className?: string;
  /** Whether to use compact sizing (for modal context) */
  compact?: boolean;
}

export function YouTubeShortsCarousel({
  showArrows = true,
  className = "",
  compact = false,
}: YouTubeShortsCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [visibleVideos, setVisibleVideos] = useState<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Update scroll button states
  const updateScrollState = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Set up intersection observer for lazy loading
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute("data-index") || "0", 10);
          if (entry.isIntersecting) {
            setVisibleVideos((prev) => new Set([...prev, index]));
          }
        });
      },
      {
        root: container,
        rootMargin: "100px",
        threshold: 0.1,
      }
    );

    // Observe all video placeholders
    const placeholders = container.querySelectorAll("[data-index]");
    placeholders.forEach((placeholder) => {
      observerRef.current?.observe(placeholder);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Update scroll state on scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", updateScrollState);
    updateScrollState();

    return () => {
      container.removeEventListener("scroll", updateScrollState);
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = compact ? 300 : 400;
    const newScrollLeft =
      direction === "left"
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });
  };

  // Sizing based on compact mode and video type
  const getCardClasses = (video: YouTubeVideo) => {
    if (video.isLandscape) {
      // Landscape videos (16:9 aspect ratio)
      return compact
        ? "w-[280px] sm:w-[320px] h-[158px] sm:h-[180px]"
        : "w-[320px] sm:w-[400px] h-[180px] sm:h-[225px]";
    }
    // Portrait videos (9:16 aspect ratio - Shorts)
    return compact
      ? "w-[140px] sm:w-[180px] h-[250px] sm:h-[320px]"
      : "w-[160px] sm:w-[180px] h-[285px] sm:h-[320px]";
  };

  const gap = compact ? "gap-3 sm:gap-4" : "gap-4";

  return (
    <div className={`relative group ${className}`}>
      {/* Navigation Arrows */}
      {showArrows && (
        <>
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={`
              hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10
              w-10 h-10 items-center justify-center
              bg-secondary/90 backdrop-blur-sm rounded-full
              border border-border shadow-lg
              transition-all duration-200
              ${canScrollLeft ? "opacity-100 hover:bg-secondary hover:scale-110" : "opacity-0 cursor-default"}
            `}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={`
              hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10
              w-10 h-10 items-center justify-center
              bg-secondary/90 backdrop-blur-sm rounded-full
              border border-border shadow-lg
              transition-all duration-200
              ${canScrollRight ? "opacity-100 hover:bg-secondary hover:scale-110" : "opacity-0 cursor-default"}
            `}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
        role="region"
        aria-label="Client transformation video stories"
      >
        <div className={`flex items-end ${gap} pb-2`}>
          {ALL_VIDEOS.map((video, index) => (
            <div
              key={video.id}
              data-index={index}
              className={`${getCardClasses(video)} bg-secondary flex-shrink-0 rounded-lg overflow-hidden shadow-lg`}
              style={{ scrollSnapAlign: "start" }}
            >
              {visibleVideos.has(index) ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${video.id}`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-primary border-b-[8px] border-b-transparent ml-1" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Hint */}
      <p className="text-xs text-muted-foreground mt-3 md:hidden">
        Swipe to see more transformations →
      </p>
    </div>
  );
}

export { YOUTUBE_SHORTS, YOUTUBE_TESTIMONIALS, ALL_VIDEOS };
