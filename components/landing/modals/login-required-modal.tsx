"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Lock, LogIn, UserPlus, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface LoginRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginRequiredModal({ open, onOpenChange }: LoginRequiredModalProps) {
  const router = useRouter();

  const handleLogin = () => {
    onOpenChange(false);
    router.push("/login?redirect=/&action=challenge-hub");
  };

  const handleRegister = () => {
    onOpenChange(false);
    router.push("/register?redirect=/&action=challenge-hub");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-4 bg-card border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-secondary">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
              Login Required
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground font-bold text-sm mt-2">
            Sign in or create an account to access the 30-Day Metaboli-k-al Challenge
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4 sm:p-6 space-y-6">
            {/* Info Section */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-1 gradient-electric" />
                <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                  Why Sign In?
                </h3>
              </div>

              <div className="athletic-card p-5 pl-8 space-y-3">
                <p className="text-sm text-muted-foreground font-bold">
                  Your free account lets you:
                </p>
                <ul className="space-y-2">
                  {[
                    "Save your progress across all devices",
                    "Get personalized protein targets based on your calculator results",
                    "Track your 30-day challenge journey",
                    "Earn and keep points for completing daily tasks",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <div className="w-1.5 h-1.5 mt-1.5 bg-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-border space-y-3">
              <button
                onClick={handleLogin}
                className="btn-athletic group w-full flex items-center justify-center gap-3 px-8 py-5 gradient-electric text-black glow-power"
              >
                <LogIn className="h-5 w-5" />
                Sign In
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={handleRegister}
                className="btn-athletic group w-full flex items-center justify-center gap-3 px-6 py-4 bg-secondary text-foreground"
              >
                <UserPlus className="h-5 w-5 text-primary" />
                Create Free Account
              </button>

              <button
                onClick={() => onOpenChange(false)}
                className="w-full px-6 py-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
