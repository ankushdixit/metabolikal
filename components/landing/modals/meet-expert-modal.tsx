"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Instagram, Youtube, ChevronRight } from "lucide-react";

interface MeetExpertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenCalendly: () => void;
}

const CREDENTIALS = [
  {
    label: "Specialization",
    value: "High-Performing Professionals | Executive Health",
  },
  {
    label: "Philosophy",
    value: "Reset Your Rhythm, Reclaim Your Life",
  },
];

const SOCIAL_LINKS = [
  {
    icon: Instagram,
    label: "Follow My Journey",
    href: "https://www.instagram.com/metabolikal",
  },
  {
    icon: Youtube,
    label: "Watch, Learn & Level Up",
    href: "https://www.youtube.com/@Metabolikal_1",
  },
];

export function MeetExpertModal({ open, onOpenChange, onOpenCalendly }: MeetExpertModalProps) {
  const handleCalendlyClick = () => {
    onOpenChange(false);
    onOpenCalendly();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">
            Meet Your Expert
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-8">
          {/* Expert photo and intro */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative w-full md:w-48 h-48 flex-shrink-0">
              <Image
                src="/images/shivashish-lifestyle.jpg"
                alt="Shivashish Sinha"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-black uppercase tracking-tight mb-1">
                Shivashish Sinha
              </h3>
              <p className="text-primary font-bold text-sm uppercase tracking-wider mb-4">
                Founder & Metabolic Transformation Specialist
              </p>
            </div>
          </div>

          {/* Quote */}
          <div className="athletic-card p-6 pl-10">
            <blockquote className="text-lg text-muted-foreground font-bold italic leading-relaxed">
              &ldquo;Fat loss isn&apos;t about eating less. It&apos;s about burning better. I
              don&apos;t coach people to punish their metabolism—I teach them to master it.&rdquo;
            </blockquote>
            <cite className="block mt-4 text-sm text-primary font-black uppercase tracking-wider not-italic">
              — Shivashish Sinha
            </cite>
          </div>

          {/* Personal Story */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-1 gradient-electric" />
              <h4 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                The Journey
              </h4>
            </div>

            <div className="space-y-4 text-muted-foreground font-bold leading-relaxed">
              <p>
                &ldquo;I was exactly where you are.&rdquo; A high-performing executive trapped in
                the cycle of energy crashes, midnight cravings, and the exhausting balance between
                ambition and vitality.
              </p>
              <p>
                After years of trying every diet, workout plan, and productivity hack, I discovered
                the truth: Your metabolism isn&apos;t broken. Your rhythm is.
              </p>
              <p>
                This revelation led to my own transformation—but more importantly, it revealed the
                elite system that works for people like us: driven, ambitious, and unwilling to
                compromise excellence.
              </p>
            </div>
          </section>

          {/* Credentials */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-1 gradient-electric" />
              <h4 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                Credentials
              </h4>
            </div>

            <div className="space-y-3">
              {CREDENTIALS.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"
                >
                  <span className="text-xs font-black tracking-wider text-muted-foreground uppercase min-w-[120px]">
                    {item.label}
                  </span>
                  <span className="font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Social Links */}
          <section className="flex flex-col sm:flex-row gap-3">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-athletic flex items-center gap-3 px-6 py-3 bg-secondary text-foreground"
              >
                <link.icon className="h-5 w-5 text-primary" />
                {link.label}
              </a>
            ))}
          </section>

          {/* CTA */}
          <div className="pt-4 border-t border-border">
            <button
              onClick={handleCalendlyClick}
              className="btn-athletic group w-full flex items-center justify-center gap-3 px-8 py-5 gradient-electric text-black glow-power"
            >
              Reset your Rhythm
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
