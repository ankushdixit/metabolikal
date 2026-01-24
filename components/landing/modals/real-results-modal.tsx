"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Instagram, ExternalLink } from "lucide-react";
import { BeforeAfterCarousel } from "@/components/landing/before-after-carousel";

interface RealResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INSTAGRAM_CARDS = [
  {
    title: "Before & After Stories",
    description: "Real clients, real results, real transformations",
  },
  {
    title: "Client Wins",
    description: "Daily posts of metabolic breakthroughs",
  },
  {
    title: "Learn & Level Up",
    description: "Metabolic tips & transformation strategies",
  },
];

export function RealResultsModal({ open, onOpenChange }: RealResultsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-card p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-4 bg-card border-b border-border flex-shrink-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">
            Transformation <span className="gradient-athletic">Gallery</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm mt-2">
            See the incredible before &amp; after transformations achieved by our community.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
            {/* Before/After Carousel Section */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-1 gradient-electric" />
                <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                  Before &amp; After Results
                </h3>
              </div>
              <p className="text-muted-foreground font-bold text-sm mb-6">
                Real transformations from high-performing professionals
              </p>

              <BeforeAfterCarousel />
            </section>

            {/* Instagram Section */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-1 gradient-electric" />
                <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                  Connect With Our Community
                </h3>
              </div>
              <p className="text-muted-foreground font-bold text-sm mb-6">
                See daily transformation stories, client wins, and metabolic breakthroughs on our
                social channels
              </p>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {INSTAGRAM_CARDS.map((card) => (
                  <div
                    key={card.title}
                    className="athletic-card p-4 sm:p-6 pl-6 sm:pl-8 hover:glow-power transition-all"
                  >
                    <Instagram className="h-5 w-5 sm:h-6 sm:w-6 text-primary mb-3 sm:mb-4" />
                    <h4 className="font-black uppercase tracking-wide mb-2 text-sm sm:text-base">
                      {card.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground font-bold">
                      {card.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Instagram CTA */}
              <div className="mt-8 text-center">
                <a
                  href="https://www.instagram.com/metabolikal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-athletic group inline-flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 gradient-electric text-black glow-power text-sm sm:text-base"
                >
                  <Instagram className="h-5 w-5 flex-shrink-0" />
                  <span className="hidden sm:inline">
                    Follow @metabolikal for Daily Transformations
                  </span>
                  <span className="sm:hidden">Follow @metabolikal</span>
                  <ExternalLink className="h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
