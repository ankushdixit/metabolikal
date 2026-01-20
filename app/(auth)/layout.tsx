import Image from "next/image";
import Link from "next/link";

/**
 * Auth Layout
 * Minimal centered layout for authentication pages.
 * Uses the athletic design theme with brand colors.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background speed-lines flex flex-col">
      <header className="p-6">
        <Link href="/" className="inline-block">
          <Image
            src="/images/logo.png"
            alt="METABOLI-K-AL"
            width={160}
            height={40}
            className="h-10 w-auto"
          />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="athletic-card rounded-sm p-8">{children}</div>
        </div>
      </main>

      <footer className="p-6 text-center text-muted-foreground text-sm">
        &copy; {new Date().getFullYear()} METABOLI-K-AL. All rights reserved.
      </footer>
    </div>
  );
}
