"use client";

import { useState } from "react";
import { useDelete } from "@refinedev/core";
import Link from "next/link";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { useMealTypes } from "@/hooks/use-meal-types";
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
import type { MealTypeRow } from "@/lib/database.types";

/**
 * Meal Types Configuration Page
 * Lists all meal types with CRUD operations
 */
export default function MealTypesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MealTypeRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch all meal types (including inactive for admin)
  const { mealTypes, isLoading, refetch } = useMealTypes({ includeInactive: true });

  // Delete mutation
  const deleteMutation = useDelete();
  const isDeleting = deleteMutation.mutation.isPending;

  // Paginate
  const totalPages = Math.ceil(mealTypes.length / ADMIN_PAGE_SIZE);
  const paginatedItems = mealTypes.slice(
    (currentPage - 1) * ADMIN_PAGE_SIZE,
    currentPage * ADMIN_PAGE_SIZE
  );

  // Handle delete confirmation
  const handleDeleteClick = (item: MealTypeRow) => {
    setItemToDelete(item);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  // Perform delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    // Check if meal type is used in food_items
    const supabase = createBrowserSupabaseClient();

    const { data: foodItems } = await supabase
      .from("food_items")
      .select("id, meal_types")
      .not("meal_types", "is", null);

    // Check if any food item uses this meal type slug
    const usageCount = (foodItems || []).filter((item) =>
      item.meal_types?.includes(itemToDelete.slug)
    ).length;

    if (usageCount > 0) {
      setDeleteError(
        `Cannot delete: This meal type is used by ${usageCount} food item${usageCount > 1 ? "s" : ""}. Deactivate it instead.`
      );
      return;
    }

    deleteMutation.mutate(
      {
        resource: "meal_types",
        id: itemToDelete.id,
      },
      {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setItemToDelete(null);
          refetch();
        },
        onError: () => {
          setDeleteError("Failed to delete meal type. Please try again.");
        },
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              Meal <span className="gradient-athletic">Types</span>
            </h1>
            <p className="text-sm text-muted-foreground font-bold">
              Configure meal categories for food items and diet plans
            </p>
          </div>
          <Link
            href="/admin/config/meal-types/create"
            className="btn-athletic inline-flex items-center justify-center gap-2 px-6 py-3 gradient-electric text-black glow-power"
          >
            <Plus className="h-5 w-5" />
            <span>Add Meal Type</span>
          </Link>
        </div>
      </div>

      {/* Meal Types Table */}
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
            <p className="text-muted-foreground font-bold">No meal types found</p>
            <Link
              href="/admin/config/meal-types/create"
              className="btn-athletic inline-flex items-center gap-2 px-4 py-2 mt-4 gradient-electric text-black"
            >
              <Plus className="h-4 w-4" />
              <span>Add your first meal type</span>
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground w-16">
                      Order
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                      Name
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                      Slug
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground text-center">
                      Status
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((item: MealTypeRow) => (
                    <TableRow key={item.id} className="border-border">
                      <TableCell className="text-muted-foreground font-mono">
                        {item.display_order}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold">{item.name}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {item.slug}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.is_active ? (
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-neon-green/20 text-neon-green text-xs font-bold uppercase">
                            <Check className="h-3 w-3" />
                            Active
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-muted-foreground text-xs font-bold uppercase">
                            <X className="h-3 w-3" />
                            Inactive
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/config/meal-types/edit/${item.id}`}
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
                Delete <span className="gradient-athletic">{itemToDelete?.name}</span>?
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-bold mt-2">
                This action cannot be undone.
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
