import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PushPermissionPrompt } from "@/components/push/push-permission-prompt";
import { IOSInstallPrompt } from "@/components/pwa/ios-install-prompt";
import { DashboardChallengeHub } from "@/components/dashboard/dashboard-challenge-hub";
import { DeactivationGuard } from "@/components/dashboard/deactivation-guard";
import { PlanCycleProviderWrapper } from "@/components/dashboard/plan-cycle-provider-wrapper";

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
        <div className="flex-1 flex flex-col lg:ml-64">
          {/* Desktop Header */}
          <Header />

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-6 pt-mobile-header lg:pt-6">
            <PlanCycleProviderWrapper>{children}</PlanCycleProviderWrapper>
          </main>
        </div>
      </div>

      {/* Push Notification Permission Prompt */}
      <PushPermissionPrompt delay={10000} />

      {/* iOS PWA Install Prompt */}
      <IOSInstallPrompt />

      {/* Challenge Hub floating tray + modal (for PWA users who can't navigate to landing page) */}
      <DashboardChallengeHub />

      {/* Auto-logout if account gets deactivated by admin */}
      <DeactivationGuard />
    </div>
  );
}
