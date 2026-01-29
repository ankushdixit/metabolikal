"use client";

import { useState, useEffect, useMemo } from "react";
import { useList, useDelete } from "@refinedev/core";
import Link from "next/link";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  LayoutTemplate,
  Filter,
  Utensils,
  Pill,
  Dumbbell,
  Activity,
} from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";
import { TEMPLATE_CATEGORIES } from "@/lib/validations";
import type { PlanTemplate } from "@/lib/database.types";

/**
 * Extended PlanTemplate with item counts
 */
interface PlanTemplateWithCounts extends PlanTemplate {
  template_diet_items: { count: number }[];
  template_supplement_items: { count: number }[];
  template_workout_items: { count: number }[];
  template_lifestyle_items: { count: number }[];
}

/**
 * Templates Page
 * Lists all plan templates with search, filter, and CRUD operations
 */
export default function TemplatesPage() {
  const [adminId, setAdminId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PlanTemplate | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Get current admin user ID
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setAdminId(data.user.id);
      }
    });
  }, []);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter]);

  // Fetch all templates with item counts
  const templatesQuery = useList<PlanTemplateWithCounts>({
    resource: "plan_templates",
    sorters: [{ field: "name", order: "asc" }],
    pagination: { mode: "off" },
    meta: {
      select:
        "*, template_diet_items(count), template_supplement_items(count), template_workout_items(count), template_lifestyle_items(count)",
    },
    queryOptions: {
      enabled: !!adminId,
    },
  });

  // Delete mutation
  const deleteMutation = useDelete();
  const isDeleting = deleteMutation.mutation.isPending;

  // Process data
  const templates = templatesQuery.query.data?.data || [];

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    let result = templates;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (categoryFilter) {
      result = result.filter((item) => item.category === categoryFilter);
    }

    return result;
  }, [templates, searchQuery, categoryFilter]);

  // Paginate
  const totalPages = Math.ceil(filteredTemplates.length / ADMIN_PAGE_SIZE);
  const paginatedItems = filteredTemplates.slice(
    (currentPage - 1) * ADMIN_PAGE_SIZE,
    currentPage * ADMIN_PAGE_SIZE
  );

  const isLoading = templatesQuery.query.isLoading;

  // Handle delete confirmation
  const handleDeleteClick = (item: PlanTemplate) => {
    setItemToDelete(item);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  // Perform delete (cascades to template items via FK constraint)
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    deleteMutation.mutate(
      {
        resource: "plan_templates",
        id: itemToDelete.id,
      },
      {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setItemToDelete(null);
          templatesQuery.query.refetch();
        },
        onError: () => {
          setDeleteError("Failed to delete template. Please try again.");
        },
      }
    );
  };

  // Get category label
  const getCategoryLabel = (value: string | null) => {
    if (!value) return "-";
    const category = TEMPLATE_CATEGORIES.find((c) => c.value === value);
    return category?.label || value;
  };

  // Get item counts from template
  const getItemCounts = (template: PlanTemplateWithCounts) => {
    return {
      diet: template.template_diet_items?.[0]?.count || 0,
      supplement: template.template_supplement_items?.[0]?.count || 0,
      workout: template.template_workout_items?.[0]?.count || 0,
      lifestyle: template.template_lifestyle_items?.[0]?.count || 0,
    };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              Plan <span className="gradient-athletic">Templates</span>
            </h1>
            <p className="text-sm text-muted-foreground font-bold">
              Create reusable single-day templates for client plans
            </p>
          </div>
          <Link
            href="/admin/config/templates/create"
            className="btn-athletic inline-flex items-center justify-center gap-2 px-6 py-3 gradient-electric text-black glow-power"
          >
            <Plus className="h-5 w-5" />
            <span>New Template</span>
          </Link>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-secondary border border-border text-foreground placeholder:text-muted-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-12 pr-8 py-3 bg-secondary border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer min-w-[180px]"
            >
              <option value="">All Categories</option>
              {TEMPLATE_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 text-sm text-muted-foreground font-bold">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""} found
        </div>
      </div>

      {/* Templates Table */}
      <div className="athletic-card overflow-hidden">
        {isLoading ? (
          <div className="p-4 animate-pulse">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-secondary/50">
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-secondary mb-2" />
                    <div className="h-3 w-48 bg-secondary" />
                  </div>
                  <div className="h-8 w-20 bg-secondary" />
                </div>
              ))}
            </div>
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="p-8 pl-10 text-center">
            <p className="text-muted-foreground font-bold">
              {searchQuery || categoryFilter
                ? "No templates match your search"
                : "No templates found"}
            </p>
            {!searchQuery && !categoryFilter && (
              <Link
                href="/admin/config/templates/create"
                className="btn-athletic inline-flex items-center gap-2 px-4 py-2 mt-4 gradient-electric text-black"
              >
                <Plus className="h-4 w-4" />
                <span>Create your first template</span>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                      Name
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                      Category
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                      Items
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground text-center">
                      Active
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground text-right w-24">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((item) => {
                    const counts = getItemCounts(item);
                    const totalItems =
                      counts.diet + counts.supplement + counts.workout + counts.lifestyle;

                    return (
                      <TableRow key={item.id} className="border-border">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10">
                              <LayoutTemplate className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <span className="font-bold block">{item.name}</span>
                              {item.description && (
                                <span className="text-sm text-muted-foreground line-clamp-1">
                                  {item.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <span className="px-2 py-1 bg-secondary text-xs font-bold uppercase tracking-wider">
                            {getCategoryLabel(item.category)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {totalItems === 0 ? (
                            <span className="text-muted-foreground text-sm">No items</span>
                          ) : (
                            <div className="flex items-center gap-3">
                              {counts.diet > 0 && (
                                <div
                                  className="flex items-center gap-1"
                                  title={`${counts.diet} meal${counts.diet !== 1 ? "s" : ""}`}
                                >
                                  <Utensils className="h-3.5 w-3.5 text-orange-500" />
                                  <span className="text-xs font-bold">{counts.diet}</span>
                                </div>
                              )}
                              {counts.supplement > 0 && (
                                <div
                                  className="flex items-center gap-1"
                                  title={`${counts.supplement} supplement${counts.supplement !== 1 ? "s" : ""}`}
                                >
                                  <Pill className="h-3.5 w-3.5 text-blue-500" />
                                  <span className="text-xs font-bold">{counts.supplement}</span>
                                </div>
                              )}
                              {counts.workout > 0 && (
                                <div
                                  className="flex items-center gap-1"
                                  title={`${counts.workout} workout${counts.workout !== 1 ? "s" : ""}`}
                                >
                                  <Dumbbell className="h-3.5 w-3.5 text-green-500" />
                                  <span className="text-xs font-bold">{counts.workout}</span>
                                </div>
                              )}
                              {counts.lifestyle > 0 && (
                                <div
                                  className="flex items-center gap-1"
                                  title={`${counts.lifestyle} lifestyle${counts.lifestyle !== 1 ? "s" : ""}`}
                                >
                                  <Activity className="h-3.5 w-3.5 text-purple-500" />
                                  <span className="text-xs font-bold">{counts.lifestyle}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.is_active ? (
                            <span className="inline-flex items-center justify-center px-2 py-1 bg-neon-green/20 text-neon-green text-xs font-bold uppercase">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center px-2 py-1 bg-destructive/20 text-red-500 text-xs font-bold uppercase">
                              No
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/config/templates/${item.id}/edit`}
                              className="p-2 rounded hover:bg-secondary transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(item)}
                              className="p-2 rounded hover:bg-destructive/20 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <p className="text-sm text-muted-foreground font-bold">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="btn-athletic p-2 bg-secondary text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="btn-athletic p-2 bg-secondary text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="athletic-card p-0 sm:max-w-md">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">
                Delete <span className="gradient-athletic">{itemToDelete?.name}</span>?
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-bold mt-2">
                This will delete the template and all its items. Client plans that used this
                template will not be affected.
              </DialogDescription>
            </DialogHeader>

            {deleteError && (
              <div className="mt-4 p-4 bg-destructive/20 border border-destructive/50 text-red-500 font-bold text-sm">
                {deleteError}
              </div>
            )}

            <DialogFooter className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
                className="btn-athletic flex-1 px-4 py-3 bg-secondary text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting || !!deleteError}
                className={cn(
                  "btn-athletic flex-1 px-4 py-3 text-white disabled:opacity-50",
                  deleteError ? "bg-secondary" : "bg-destructive"
                )}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
