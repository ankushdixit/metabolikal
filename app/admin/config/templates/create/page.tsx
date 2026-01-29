"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCreate } from "@refinedev/core";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { TemplateFormHeader } from "@/components/admin/templates/template-form-header";
import type { PlanTemplate, PlanTemplateInsert } from "@/lib/database.types";

/**
 * Create Template Page
 * Allows admin to create a new plan template with metadata
 */
export default function CreateTemplatePage() {
  const router = useRouter();
  const [adminId, setAdminId] = useState<string | null>(null);

  // Form state
  const [template, setTemplate] = useState<Partial<PlanTemplate>>({
    name: "",
    description: null,
    category: null,
    is_active: true,
  });

  // Get current admin user ID
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setAdminId(data.user.id);
      }
    });
  }, []);

  // Create mutation
  const createMutation = useCreate<PlanTemplate>();
  const isSubmitting = createMutation.mutation.isPending;

  const handleChange = (updates: Partial<PlanTemplate>) => {
    setTemplate((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!template.name?.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    const data: PlanTemplateInsert = {
      name: template.name.trim(),
      description: template.description || null,
      category: template.category || null,
      created_by: adminId,
      is_active: template.is_active ?? true,
    };

    try {
      const result = await createMutation.mutation.mutateAsync({
        resource: "plan_templates",
        values: data,
      });

      toast.success("Template created successfully");

      // Navigate to edit page to add items
      if (result.data?.id) {
        router.push(`/admin/config/templates/${result.data.id}/edit`);
      } else {
        router.push("/admin/config/templates");
      }
    } catch {
      toast.error("Failed to create template");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/config/templates"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm uppercase tracking-wider transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Templates</span>
      </Link>

      {/* Header */}
      <div className="athletic-card p-6 pl-8">
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
          Create <span className="gradient-athletic">Template</span>
        </h1>
        <p className="text-muted-foreground font-bold mt-1">
          Create a new reusable plan template. After saving, you can add items to the template.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <TemplateFormHeader template={template} onChange={handleChange} disabled={isSubmitting} />

        {/* Actions */}
        <div className="mt-6 flex items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting || !template.name?.trim()}
            className={cn(
              "btn-athletic inline-flex items-center justify-center gap-2 px-6 py-3 gradient-electric text-black glow-power",
              (isSubmitting || !template.name?.trim()) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Create Template</span>
              </>
            )}
          </button>

          <Link
            href="/admin/config/templates"
            className="btn-athletic inline-flex items-center justify-center px-6 py-3 bg-secondary text-foreground"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
