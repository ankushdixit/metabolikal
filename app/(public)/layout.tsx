/*
 * Design 4: Modern Athletic - Public Layout
 * Sports-inspired navigation with sharp edges and dynamic accents
 */

import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ModalProvider } from "@/contexts/modal-context";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModalProvider>
      <div className="min-h-screen bg-background speed-lines">
        <Header />
        <main>{children}</main>
        <Footer />
      </div>
    </ModalProvider>
  );
}
