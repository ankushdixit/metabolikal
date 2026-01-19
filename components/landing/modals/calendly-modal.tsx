"use client";

import { useEffect } from "react";
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

export function CalendlyModal({ open, onOpenChange }: CalendlyModalProps) {
  useEffect(() => {
    if (!open) return;

    // Load Calendly script if not already loaded
    if (!document.getElementById("calendly-script")) {
      const script = document.createElement("script");
      script.id = "calendly-script";
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      document.head.appendChild(script);
    }

    // Initialize widget when script is loaded
    const initWidget = () => {
      const container = document.getElementById("calendly-embed");
      if (container && window.Calendly) {
        container.innerHTML = "";
        window.Calendly.initInlineWidget({
          url: "https://calendly.com/metabolikal/strategy-call",
          parentElement: container,
        });
      }
    };

    // Check if script is already loaded
    if (window.Calendly) {
      initWidget();
    } else {
      const script = document.getElementById("calendly-script");
      script?.addEventListener("load", initWidget);
    }

    return () => {
      const script = document.getElementById("calendly-script");
      script?.removeEventListener("load", initWidget);
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card p-0">
        <DialogHeader className="p-6 pb-4 sticky top-0 bg-card z-10 border-b border-border">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">
            Book Your Strategy Call
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm mt-2">
            Let&apos;s engineer your metabolic transformation
          </DialogDescription>
        </DialogHeader>
        <div id="calendly-embed" className="min-h-[600px] w-full" />
      </DialogContent>
    </Dialog>
  );
}
