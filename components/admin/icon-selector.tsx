"use client";

import { useState, useMemo } from "react";
import { icons, Search, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Number of icons to display per page */
const ICONS_PER_PAGE = 60;

/** Convert PascalCase to kebab-case for display */
function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

/** Convert kebab-case to PascalCase for lookup */
function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

/** All available icon names (kebab-case for storage, PascalCase keys for lookup) */
const ALL_ICON_NAMES = Object.keys(icons)
  .filter((name) => name !== "createLucideIcon") // Filter out utility functions
  .map((pascalName) => ({
    pascalName,
    kebabName: toKebabCase(pascalName),
    searchName: pascalName.toLowerCase(),
  }));

interface IconSelectorProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Icon Selector Component
 * Visual icon picker with access to all 1500+ Lucide icons
 */
export function IconSelector({ value, onChange, className }: IconSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);

  // Filter icons based on search query
  const filteredIcons = useMemo(() => {
    if (!searchQuery) return ALL_ICON_NAMES;
    const query = searchQuery.toLowerCase().replace(/-/g, "");
    return ALL_ICON_NAMES.filter(
      (icon) => icon.searchName.includes(query) || icon.kebabName.replace(/-/g, "").includes(query)
    );
  }, [searchQuery]);

  // Reset page when search changes
  useMemo(() => {
    setPage(0);
  }, [searchQuery]);

  // Paginate results
  const totalPages = Math.ceil(filteredIcons.length / ICONS_PER_PAGE);
  const paginatedIcons = filteredIcons.slice(page * ICONS_PER_PAGE, (page + 1) * ICONS_PER_PAGE);

  // Find selected icon info for display
  const selectedIconInfo = value ? ALL_ICON_NAMES.find((icon) => icon.kebabName === value) : null;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Selected Icon Display */}
      {selectedIconInfo && (
        <div className="flex items-center gap-2 p-2 bg-primary/10 border border-primary/20">
          {(() => {
            const IconComponent = icons[
              selectedIconInfo.pascalName as keyof typeof icons
            ] as LucideIcon;
            return IconComponent ? <IconComponent className="h-5 w-5 text-primary" /> : null;
          })()}
          <span className="text-sm font-bold text-primary">{selectedIconInfo.kebabName}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search 1500+ icons..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Results Count */}
      <p className="text-xs text-muted-foreground">
        {filteredIcons.length} icon{filteredIcons.length !== 1 ? "s" : ""} found
        {totalPages > 1 && ` • Page ${page + 1} of ${totalPages}`}
      </p>

      {/* Icons Grid */}
      <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
        {paginatedIcons.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No icons match your search</p>
        ) : (
          paginatedIcons.map((iconInfo) => {
            const IconComponent = icons[iconInfo.pascalName as keyof typeof icons] as LucideIcon;
            const isSelected = value === iconInfo.kebabName;

            return (
              <button
                key={iconInfo.pascalName}
                type="button"
                onClick={() => onChange(iconInfo.kebabName)}
                className={cn(
                  "p-3 transition-all flex items-center justify-center",
                  isSelected
                    ? "gradient-electric text-black"
                    : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                )}
                aria-label={iconInfo.kebabName}
                title={iconInfo.kebabName}
              >
                {IconComponent && <IconComponent className="h-5 w-5" />}
              </button>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 text-xs font-bold bg-secondary text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1 text-xs font-bold bg-secondary text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Get the Lucide icon component for a given icon string value (kebab-case)
 */
export function getIconComponent(iconValue: string | null | undefined): LucideIcon | null {
  if (!iconValue) return null;
  const pascalName = toPascalCase(iconValue);
  return (icons[pascalName as keyof typeof icons] as LucideIcon) || null;
}

/**
 * Render an icon by its string value (kebab-case)
 */
export function RenderIcon({
  icon,
  className,
}: {
  icon: string | null | undefined;
  className?: string;
}) {
  const IconComponent = getIconComponent(icon);
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
}
