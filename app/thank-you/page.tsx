/*
 * Design 4: Modern Athletic - Thank You Page
 * Custom branded confirmation page after Calendly booking
 * Follows athletic design system with sharp edges, high contrast, dynamic motion
 */

import {
  CheckCircle2,
  Mail,
  ClipboardList,
  Video,
  ChevronLeft,
  ChevronRight,
  Star,
  Trophy,
  Crown,
  Check,
} from "lucide-react";
import Link from "next/link";

const PRE_SESSION_STEPS = [
  {
    icon: Mail,
    title: "Check Your Inbox",
    description: "Confirmation + prep materials arriving now",
  },
  {
    icon: ClipboardList,
    title: "Complete Pre-Session Form",
    description: "Help us personalize your blueprint",
  },
  {
    icon: Video,
    title: "Show Up Ready",
    description: "Your custom METABOLI-K-AL blueprint awaits",
  },
];

const SESSION_EXPECTATIONS = [
  "Deep-dive metabolic assessment tailored to your lifestyle",
  "Custom nutrition strategy that fits your schedule",
  "Lifestyle optimization roadmap for sustainable results",
  "Direct Q&A with Coach Shivashish",
];

export default function ThankYouPage() {
  return (
    <div className="relative min-h-screen py-16 px-6 md:py-24 overflow-hidden">
      {/* Floating Decorative Icons */}
      <div className="absolute top-20 left-8 md:left-16 text-yellow-500/20 animate-pulse-power">
        <Star className="h-8 w-8 md:h-12 md:w-12" />
      </div>
      <div className="absolute top-32 right-8 md:right-24 text-yellow-500/20 animate-pulse-power delay-200">
        <Trophy className="h-10 w-10 md:h-14 md:w-14" />
      </div>
      <div className="absolute bottom-32 left-12 md:left-24 text-yellow-500/20 animate-pulse-power delay-300">
        <Crown className="h-8 w-8 md:h-10 md:w-10" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Success Icon */}
        <div className="flex justify-center mb-8 animate-slide-power">
          <div className="p-4 bg-green-500/20 rounded-full">
            <CheckCircle2 className="h-16 w-16 md:h-20 md:w-20 text-green-500" />
          </div>
        </div>

        {/* Main Headline */}
        <div className="text-center mb-12 animate-slide-power delay-100">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight uppercase mb-6">
            You&apos;re In.{" "}
            <span className="gradient-athletic">Let&apos;s Build Your Blueprint.</span>
          </h1>
          <p className="text-lg md:text-xl font-bold text-muted-foreground max-w-2xl mx-auto">
            You&apos;ve taken the first step toward mastering your metabolic operating system.
            <br className="hidden md:block" />
            Check your email for confirmation and preparation materials.
          </p>
        </div>

        {/* Pre-Session Checklist Section */}
        <div className="athletic-card p-6 md:p-8 pl-8 md:pl-10 mb-8 animate-slide-power delay-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-1 gradient-electric" />
            <h2 className="text-sm font-black tracking-[0.2em] text-primary uppercase">
              Your Pre-Session Checklist
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PRE_SESSION_STEPS.map((step, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex p-4 bg-secondary mb-4">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-black text-foreground uppercase tracking-wide mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground font-bold">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What to Expect Section */}
        <div className="athletic-card p-6 md:p-8 pl-8 md:pl-10 mb-12 animate-slide-power delay-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-1 gradient-electric" />
            <h2 className="text-sm font-black tracking-[0.2em] text-primary uppercase">
              What We&apos;ll Cover In Your Session
            </h2>
          </div>

          <div className="space-y-4">
            {SESSION_EXPECTATIONS.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="mt-1 p-1 bg-green-500/20">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
                <p className="font-bold text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-power delay-400">
          <Link
            href="/"
            className="btn-athletic group flex items-center gap-3 px-8 py-5 gradient-electric text-black glow-power"
          >
            <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            Back to Homepage
          </Link>

          <Link
            href="/?modal=assessment"
            className="btn-athletic group flex items-center gap-3 px-8 py-5 bg-secondary text-foreground"
          >
            Take the Assessment While You Wait
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
