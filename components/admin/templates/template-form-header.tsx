"use client";

import { TEMPLATE_CATEGORIES } from "@/lib/validations";
import type { PlanTemplate } from "@/lib/database.types";

interface TemplateFormHeaderProps {
  template: Partial<PlanTemplate>;
  onChange: (updates: Partial<PlanTemplate>) => void;
  _isEditing?: boolean;
  disabled?: boolean;
}

/**
 * Template metadata form header
 * Displays name, description, category, and active toggle
 */
export function TemplateFormHeader({
  template,
  onChange,
  _isEditing = false,
  disabled = false,
}: TemplateFormHeaderProps) {
  return (
    <div className="athletic-card p-6 pl-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Name */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">
            Template Name *
          </label>
          <input
            type="text"
            value={template.name || ""}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g., High Protein Day"
            disabled={disabled}
            className="w-full px-4 py-3 bg-secondary border border-border text-foreground placeholder:text-muted-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">
            Category
          </label>
          <select
            value={template.category || ""}
            onChange={(e) => onChange({ category: e.target.value || null })}
            disabled={disabled}
            className="w-full px-4 py-3 bg-secondary border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 appearance-none cursor-pointer"
          >
            <option value="">Select category</option>
            {TEMPLATE_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Active Toggle */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">
            Status
          </label>
          <button
            type="button"
            onClick={() => onChange({ is_active: !template.is_active })}
            disabled={disabled}
            className={`w-full px-4 py-3 border font-bold focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 ${
              template.is_active
                ? "bg-neon-green/20 border-neon-green/50 text-neon-green"
                : "bg-secondary border-border text-muted-foreground"
            }`}
          >
            {template.is_active ? "ACTIVE" : "INACTIVE"}
          </button>
        </div>

        {/* Description */}
        <div className="lg:col-span-4">
          <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">
            Description
          </label>
          <textarea
            value={template.description || ""}
            onChange={(e) => onChange({ description: e.target.value || null })}
            placeholder="Optional description for this template..."
            disabled={disabled}
            rows={2}
            className="w-full px-4 py-3 bg-secondary border border-border text-foreground placeholder:text-muted-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
