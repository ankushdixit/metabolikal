"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Instagram, ExternalLink } from "lucide-react";

interface RealResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const YOUTUBE_VIDEOS = [
  {
    id: "VIDEO_ID_1",
    title: "Client Transformation Story 1",
  },
  {
    id: "VIDEO_ID_2",
    title: "Client Transformation Story 2",
  },
  {
    id: "VIDEO_ID_3",
    title: "Metabolic Health Insights",
  },
];

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card p-0">
        <DialogHeader className="p-6 pb-4 sticky top-0 bg-card z-10 border-b border-border">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">
            Real People. <span className="gradient-athletic">Real Transformations.</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm mt-2">
            See the incredible transformations achieved by our community.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-8">
          {/* YouTube Shorts Section */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-1 gradient-electric" />
              <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                Watch Real Client Transformations
              </h3>
            </div>
            <p className="text-muted-foreground font-bold text-sm mb-4">
              Real transformation stories and metabolic health insights
            </p>

            {/* Horizontally scrollable shorts container */}
            <div className="overflow-x-auto overflow-y-hidden">
              <div className="flex gap-4 pb-2">
                {YOUTUBE_VIDEOS.map((video) => (
                  <div
                    key={video.id}
                    className="w-[180px] h-[320px] bg-secondary flex-shrink-0 rounded-lg overflow-hidden"
                  >
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${video.id}`}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Swipe to see more transformations</p>
          </section>

          {/* Main transformation image */}
          <section>
            <div className="relative w-full aspect-[16/9] athletic-card overflow-hidden">
              <Image
                src="/images/real-results-testimonials.jpg"
                alt="Client transformations"
                fill
                className="object-cover"
              />
            </div>
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

            <div className="grid md:grid-cols-3 gap-4">
              {INSTAGRAM_CARDS.map((card) => (
                <div
                  key={card.title}
                  className="athletic-card p-6 pl-8 hover:glow-power transition-all"
                >
                  <Instagram className="h-6 w-6 text-primary mb-4" />
                  <h4 className="font-black uppercase tracking-wide mb-2">{card.title}</h4>
                  <p className="text-sm text-muted-foreground font-bold">{card.description}</p>
                </div>
              ))}
            </div>

            {/* Instagram CTA */}
            <div className="mt-8 text-center">
              <a
                href="https://www.instagram.com/metabolikal"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-athletic group inline-flex items-center gap-3 px-8 py-4 gradient-electric text-black glow-power"
              >
                <Instagram className="h-5 w-5" />
                Follow @metabolikal for Daily Transformations
                <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
