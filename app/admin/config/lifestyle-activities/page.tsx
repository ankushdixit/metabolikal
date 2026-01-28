"use client";

import { useState, useEffect, useMemo } from "react";
import { useList } from "@refinedev/core";
import Link from "next/link";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Activity,
  Filter,
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
import { LIFESTYLE_ACTIVITY_CATEGORIES } from "@/lib/validations";
import { RenderIcon } from "@/components/admin/icon-selector";
import type { LifestyleActivityType } from "@/lib/database.types";

/**
 * Lifestyle Activities Library Page
 * Lists all lifestyle activity types with search, filter, and CRUD operations
 */
export default function LifestyleActivitiesLibraryPage() {
  const [adminId, setAdminId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<LifestyleActivityType | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Fetch all lifestyle activity types (disable server pagination to get all records)
  const activityTypesQuery = useList<LifestyleActivityType>({
    resource: "lifestyle_activity_types",
    sorters: [{ field: "name", order: "asc" }],
    pagination: { mode: "off" },
    queryOptions: {
      enabled: !!adminId,
    },
  });

  // Process data
  const activityTypes = activityTypesQuery.query.data?.data || [];

  // Filter activity types based on search and category
  const filteredActivityTypes = useMemo(() => {
    let result = activityTypes;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item: LifestyleActivityType) =>
        item.name.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (categoryFilter) {
      result = result.filter((item: LifestyleActivityType) => item.category === categoryFilter);
    }

    return result;
  }, [activityTypes, searchQuery, categoryFilter]);

  // Paginate
  const totalPages = Math.ceil(filteredActivityTypes.length / ADMIN_PAGE_SIZE);
  const paginatedItems = filteredActivityTypes.slice(
    (currentPage - 1) * ADMIN_PAGE_SIZE,
    currentPage * ADMIN_PAGE_SIZE
  );

  const isLoading = activityTypesQuery.query.isLoading;

  // Handle delete confirmation
  const handleDeleteClick = (item: LifestyleActivityType) => {
    setItemToDelete(item);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  // Perform soft delete (set is_active = false)
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    const supabase = createBrowserSupabaseClient();

    // Check if activity type is used in active lifestyle_activity_plans
    const { count: planCount } = await supabase
      .from("lifestyle_activity_plans")
      .select("*", { count: "exact", head: true })
      .eq("activity_type_id", itemToDelete.id);

    if (planCount && planCount > 0) {
      setDeleteError(
        `Warning: This activity type is used in ${planCount} lifestyle plan${planCount > 1 ? "s" : ""}. Deactivating instead of deleting.`
      );
    }

    // Soft delete by updating is_active to false
    const { error } = await supabase
      .from("lifestyle_activity_types")
      .update({ is_active: false })
      .eq("id", itemToDelete.id);

    if (error) {
      setDeleteError("Failed to deactivate activity type. Please try again.");
      setIsDeleting(false);
      return;
    }

    setDeleteDialogOpen(false);
    setItemToDelete(null);
    setIsDeleting(false);
    activityTypesQuery.query.refetch();
  };

  // Get category label
  const getCategoryLabel = (value: string) => {
    const category = LIFESTYLE_ACTIVITY_CATEGORIES.find((c) => c.value === value);
    return category?.label || value;
  };

  // Format target display
  const formatTarget = (item: LifestyleActivityType) => {
    if (item.default_target_value && item.target_unit) {
      return `${item.default_target_value.toLocaleString()} ${item.target_unit}`;
    }
    if (item.default_target_value) {
      return item.default_target_value.toLocaleString();
    }
    return "-";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              Lifestyle <span className="gradient-athletic">Activities</span>
            </h1>
            <p className="text-sm text-muted-foreground font-bold">
              Manage lifestyle activity definitions for client plans
            </p>
          </div>
          <Link
            href="/admin/config/lifestyle-activities/create"
            className="btn-athletic inline-flex items-center justify-center gap-2 px-6 py-3 gradient-electric text-black glow-power"
          >
            <Plus className="h-5 w-5" />
            <span>Add Activity Type</span>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by activity name..."
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
              className="pl-12 pr-8 py-3 bg-secondary border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="">All Categories</option>
              {LIFESTYLE_ACTIVITY_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 text-sm text-muted-foreground font-bold">
          {filteredActivityTypes.length} activity type
          {filteredActivityTypes.length !== 1 ? "s" : ""} found
        </div>
      </div>

      {/* Activity Types Table */}
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
                ? "No activity types match your search"
                : "No activity types found"}
            </p>
            {!searchQuery && !categoryFilter && (
              <Link
                href="/admin/config/lifestyle-activities/create"
                className="btn-athletic inline-flex items-center gap-2 px-4 py-2 mt-4 gradient-electric text-black"
              >
                <Plus className="h-4 w-4" />
                <span>Add your first activity type</span>
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
                      Icon
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                      Name
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                      Category
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                      Default Target
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground text-center">
                      Active
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((item: LifestyleActivityType) => (
                    <TableRow key={item.id} className="border-border">
                      <TableCell>
                        <div className="p-2 bg-primary/10 inline-flex">
                          {item.icon ? (
                            <RenderIcon icon={item.icon} className="h-5 w-5 text-primary" />
                          ) : (
                            <Activity className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold">{item.name}</span>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <span className="px-2 py-1 bg-secondary text-xs font-bold uppercase tracking-wider">
                          {getCategoryLabel(item.category)}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-bold">
                        {formatTarget(item)}
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
                            href={`/admin/config/lifestyle-activities/edit/${item.id}`}
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
                  ))}
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
                Deactivate <span className="gradient-athletic">{itemToDelete?.name}</span>?
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-bold mt-2">
                This will set the activity type as inactive. It will no longer appear in new
                lifestyle plans.
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
                disabled={isDeleting}
                className={cn(
                  "btn-athletic flex-1 px-4 py-3 text-white disabled:opacity-50",
                  "bg-destructive"
                )}
              >
                {isDeleting ? "Deactivating..." : "Deactivate"}
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
