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

const YOUTUBE_SHORTS = [
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

const YOUTUBE_VIDEOS = [
  { id: "K-HAAkZ1MzI", title: "Client Testimonial" },
  { id: "KKejfj9_ZIA", title: "Client Testimonial" },
  { id: "qsTew1fhnPY", title: "Client Testimonial" },
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
      <DialogContent className="sm:max-w-4xl bg-card p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-4 bg-card border-b border-border flex-shrink-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">
            Real People. <span className="gradient-athletic">Real Transformations.</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm mt-2">
            See the incredible transformations achieved by our community.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
            {/* YouTube Shorts Section */}
            <section className="overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-1 gradient-electric" />
                <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                  Client Transformation Stories
                </h3>
              </div>
              <p className="text-muted-foreground font-bold text-sm mb-4">
                Real transformation stories from our community
              </p>

              {/* Horizontally scrollable shorts container */}
              <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto overflow-y-hidden">
                <div className="flex gap-3 sm:gap-4 pb-2">
                  {YOUTUBE_SHORTS.map((video) => (
                    <div
                      key={video.id}
                      className="w-[140px] sm:w-[180px] h-[250px] sm:h-[320px] bg-secondary flex-shrink-0 rounded-lg overflow-hidden"
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
              <p className="text-xs text-muted-foreground mt-2">
                Swipe to see more transformations
              </p>
            </section>

            {/* Full Testimonials Section */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-1 gradient-electric" />
                <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                  Client Testimonials
                </h3>
              </div>
              <div className="space-y-4">
                {YOUTUBE_VIDEOS.map((video) => (
                  <div
                    key={video.id}
                    className="relative w-full aspect-video bg-secondary rounded-lg overflow-hidden"
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
