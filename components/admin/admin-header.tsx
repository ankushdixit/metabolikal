/**
 * Admin header component (desktop only)
 * Athletic-styled header
 */
export function AdminHeader() {
  return (
    <header className="hidden lg:block sticky top-0 z-40 bg-card border-b border-border">
      <div className="flex h-14 items-center px-6">
        {/* Page breadcrumb area */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-1 gradient-electric" />
          <span className="text-xs font-black tracking-[0.15em] text-primary uppercase">Admin</span>
        </div>
      </div>
    </header>
  );
}
