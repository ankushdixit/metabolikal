/*
 * Design 4: Modern Athletic - Public Layout
 * Sports-inspired navigation with sharp edges and dynamic accents
 */

import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background speed-lines">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
