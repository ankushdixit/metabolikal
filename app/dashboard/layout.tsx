import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

/**
 * Dashboard layout
 * Athletic-styled layout with responsive sidebar navigation
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background speed-lines">
      {/* Mobile Navigation */}
      <MobileNav />

      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:ml-0">
          {/* Desktop Header */}
          <Header />

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-6 pt-20 lg:pt-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
