/*
 * Landing Page Footer Component
 * Athletic-styled footer with social links
 */

"use client";

import Image from "next/image";
import Link from "next/link";
import { useModalContext } from "@/contexts/modal-context";

// Simple YouTube icon component
function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

// Simple Instagram icon component
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

const navItems = ["Home", "Transformations", "About", "Challenge"];

export function Footer() {
  const { openModal } = useModalContext();

  return (
    <footer className="bg-card border-t border-border">
      <div className="h-1 gradient-electric" />

      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative h-10 w-10">
                <Image src="/images/logo.png" alt="Metabolikal" fill className="object-contain" />
              </div>
              <span className="text-xl font-black tracking-tight">
                METABOLI<span className="gradient-athletic">K</span>AL
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-bold leading-relaxed uppercase tracking-wide mb-6">
              Reset Your Rhythm.
              <br />
              Reclaim Your Life.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3">
              <a
                href="https://www.youtube.com/@Metabolikal_1"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="YouTube"
              >
                <YoutubeIcon className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/metabolikal"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-black tracking-[0.2em] text-primary mb-6 uppercase flex items-center gap-2">
              <span className="w-4 h-1 gradient-electric" />
              Navigate
            </h4>
            <ul className="space-y-3">
              {navItems.map((item) => (
                <li key={item}>
                  <Link
                    href={item === "Home" ? "#" : `#${item.toLowerCase()}`}
                    className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Programs */}
          <div>
            <h4 className="text-xs font-black tracking-[0.2em] text-primary mb-6 uppercase flex items-center gap-2">
              <span className="w-4 h-1 gradient-electric" />
              Programs
            </h4>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => openModal("elite-programs")}
                  className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide text-left cursor-pointer"
                >
                  Elite Programs
                </button>
              </li>
              <li>
                <button
                  onClick={() => openModal("method")}
                  className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide text-left cursor-pointer"
                >
                  The Method
                </button>
              </li>
              <li>
                <button
                  onClick={() => openModal("challenge-hub")}
                  className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide text-left cursor-pointer"
                >
                  30-Day Challenge
                </button>
              </li>
            </ul>
          </div>

          {/* Get Started */}
          <div>
            <h4 className="text-xs font-black tracking-[0.2em] text-primary mb-6 uppercase flex items-center gap-2">
              <span className="w-4 h-1 gradient-electric" />
              Start Now
            </h4>
            <div className="space-y-3">
              <button
                onClick={() => openModal("assessment")}
                className="btn-athletic px-6 py-3 text-sm bg-secondary text-foreground w-full"
              >
                Take Assessment
              </button>
              <button
                onClick={() => openModal("calendly")}
                className="btn-athletic px-6 py-3 text-sm text-primary-foreground gradient-electric w-full"
              >
                Book Strategy Call
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground font-bold text-center uppercase tracking-[0.2em]">
            &copy; {new Date().getFullYear()} METABOLI-K-AL. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
