"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useOne, useUpdate } from "@refinedev/core";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { TemplateFormHeader } from "@/components/admin/templates/template-form-header";
import { TemplateEditor } from "@/components/admin/templates/template-editor";
import type { PlanTemplate, PlanTemplateUpdate } from "@/lib/database.types";

/**
 * Edit Template Page
 * Allows admin to edit template metadata and add/edit items via the timeline editor
 */
export default function EditTemplatePage() {
  const params = useParams();
  const templateId = params.id as string;

  const [adminId, setAdminId] = useState<string | null>(null);

  // Local form state for metadata
  const [localTemplate, setLocalTemplate] = useState<Partial<PlanTemplate> | null>(null);
  const [hasMetadataChanges, setHasMetadataChanges] = useState(false);

  // Get current admin user ID
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setAdminId(data.user.id);
      }
    });
  }, []);

  // Fetch template
  const templateQuery = useOne<PlanTemplate>({
    resource: "plan_templates",
    id: templateId,
    queryOptions: {
      enabled: !!templateId && !!adminId,
    },
  });

  const template = templateQuery.query.data?.data;

  // Initialize local state when template loads
  useEffect(() => {
    if (template && !localTemplate) {
      setLocalTemplate({
        name: template.name,
        description: template.description,
        category: template.category,
        is_active: template.is_active,
      });
    }
  }, [template, localTemplate]);

  // Update mutation
  const updateMutation = useUpdate<PlanTemplate>();
  const isSubmitting = updateMutation.mutation.isPending;

  const handleChange = useCallback((updates: Partial<PlanTemplate>) => {
    setLocalTemplate((prev) => ({ ...prev, ...updates }));
    setHasMetadataChanges(true);
  }, []);

  const handleSaveMetadata = async () => {
    if (!localTemplate?.name?.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    const data: PlanTemplateUpdate = {
      name: localTemplate.name.trim(),
      description: localTemplate.description || null,
      category: localTemplate.category || null,
      is_active: localTemplate.is_active ?? true,
    };

    try {
      await updateMutation.mutation.mutateAsync({
        resource: "plan_templates",
        id: templateId,
        values: data,
      });

      toast.success("Template updated successfully");
      setHasMetadataChanges(false);
      templateQuery.query.refetch();
    } catch {
      toast.error("Failed to update template");
    }
  };

  if (templateQuery.query.isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="athletic-card p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground font-bold">Loading template...</span>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="athletic-card p-8 text-center">
          <p className="text-muted-foreground font-bold">Template not found</p>
          <Link
            href="/admin/config/templates"
            className="btn-athletic inline-flex items-center gap-2 px-4 py-2 mt-4 bg-secondary text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Templates</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/config/templates"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm uppercase tracking-wider transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Templates</span>
      </Link>

      {/* Header with save button */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
              Edit <span className="gradient-athletic">Template</span>
            </h1>
            <p className="text-muted-foreground font-bold mt-1">{template.name}</p>
          </div>

          {hasMetadataChanges && (
            <button
              onClick={handleSaveMetadata}
              disabled={isSubmitting || !localTemplate?.name?.trim()}
              className={cn(
                "btn-athletic inline-flex items-center justify-center gap-2 px-6 py-3 gradient-electric text-black glow-power",
                (isSubmitting || !localTemplate?.name?.trim()) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Template Metadata Form */}
      {localTemplate && (
        <TemplateFormHeader
          template={localTemplate}
          onChange={handleChange}
          _isEditing={true}
          disabled={isSubmitting}
        />
      )}

      {/* Template Items Editor */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Template Items
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <TemplateEditor templateId={templateId} />
      </div>
    </div>
  );
}
