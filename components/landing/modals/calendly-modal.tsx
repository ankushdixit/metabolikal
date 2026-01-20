"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface CalendlyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: {
        url: string;
        parentElement: Element;
        prefill?: Record<string, unknown>;
        utm?: Record<string, string>;
      }) => void;
    };
  }
}

// Calendly URL with dark mode styling to match modal
// Colors: background (card hsl 0 0% 7% = #121212), text (white), primary (brand orange)
const CALENDLY_URL =
  "https://calendly.com/shivashish-sinha-metabolikal/strategy-call-metaboli-k-al-web-reprograming-360?background_color=121212&text_color=ffffff&primary_color=e85a3c";

export function CalendlyModal({ open, onOpenChange }: CalendlyModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const initWidget = useCallback(() => {
    const container = containerRef.current;
    if (!container || !window.Calendly || initializedRef.current) return;

    container.innerHTML = "";
    window.Calendly.initInlineWidget({
      url: CALENDLY_URL,
      parentElement: container,
    });
    initializedRef.current = true;
  }, []);

  useEffect(() => {
    if (!open) {
      // Reset initialization flag when modal closes
      initializedRef.current = false;
      return;
    }

    // Load Calendly script if not already loaded
    const existingScript = document.getElementById("calendly-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "calendly-script";
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      script.onload = () => {
        // Small delay to ensure DOM is ready
        requestAnimationFrame(() => {
          initWidget();
        });
      };
      document.head.appendChild(script);
    } else if (window.Calendly) {
      // Script already loaded, initialize after DOM is ready
      requestAnimationFrame(() => {
        initWidget();
      });
    } else {
      // Script exists but not loaded yet, wait for it
      existingScript.addEventListener("load", () => {
        requestAnimationFrame(() => {
          initWidget();
        });
      });
    }
  }, [open, initWidget]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[90vh] max-h-[900px] bg-card p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-4 bg-card border-b border-border flex-shrink-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">
            Book Your Strategy Call
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm mt-2">
            Let&apos;s engineer your metabolic transformation
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <div ref={containerRef} className="h-full w-full" data-testid="calendly-embed" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
