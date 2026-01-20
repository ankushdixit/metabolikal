import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";

/**
 * Admin layout
 * Athletic-styled layout with responsive sidebar navigation
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background speed-lines">
      {/* Mobile Navigation */}
      <AdminMobileNav />

      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <AdminSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:ml-64">
          {/* Desktop Header */}
          <AdminHeader />

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-6 pt-20 lg:pt-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
