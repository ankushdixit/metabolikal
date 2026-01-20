"use client";

import { useState, useEffect, useMemo } from "react";
import { useList, useDelete } from "@refinedev/core";
import Link from "next/link";
import { Search, Plus, Leaf, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
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
import type { FoodItem } from "@/lib/database.types";

const PAGE_SIZE = 10;

/**
 * Food Database Page
 * Lists all food items with search and CRUD operations
 */
export default function FoodDatabasePage() {
  const [adminId, setAdminId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FoodItem | null>(null);
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

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Fetch all food items
  const foodItemsQuery = useList<FoodItem>({
    resource: "food_items",
    sorters: [{ field: "name", order: "asc" }],
    queryOptions: {
      enabled: !!adminId,
    },
  });

  // Delete mutation
  const deleteMutation = useDelete();
  const isDeleting = deleteMutation.mutation.isPending;

  // Process data
  const foodItems = foodItemsQuery.query.data?.data || [];

  // Filter food items based on search
  const filteredFoodItems = useMemo(() => {
    if (!searchQuery) return foodItems;

    const query = searchQuery.toLowerCase();
    return foodItems.filter((item: FoodItem) => item.name.toLowerCase().includes(query));
  }, [foodItems, searchQuery]);

  // Paginate
  const totalPages = Math.ceil(filteredFoodItems.length / PAGE_SIZE);
  const paginatedItems = filteredFoodItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const isLoading = foodItemsQuery.query.isLoading;

  // Handle delete confirmation
  const handleDeleteClick = (item: FoodItem) => {
    setItemToDelete(item);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  // Perform delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    // Check if food item is used in diet_plans
    const supabase = createBrowserSupabaseClient();

    const { count: dietPlanCount } = await supabase
      .from("diet_plans")
      .select("*", { count: "exact", head: true })
      .eq("food_item_id", itemToDelete.id);

    const { count: alternativesCount } = await supabase
      .from("food_alternatives")
      .select("*", { count: "exact", head: true })
      .eq("food_item_id", itemToDelete.id);

    const totalUsage = (dietPlanCount || 0) + (alternativesCount || 0);

    if (totalUsage > 0) {
      setDeleteError(
        `Cannot delete: This food is used in ${totalUsage} diet plan${totalUsage > 1 ? "s" : ""}`
      );
      return;
    }

    deleteMutation.mutate(
      {
        resource: "food_items",
        id: itemToDelete.id,
      },
      {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setItemToDelete(null);
          foodItemsQuery.query.refetch();
        },
        onError: () => {
          setDeleteError("Failed to delete food item. Please try again.");
        },
      }
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              Food <span className="gradient-athletic">Database</span>
            </h1>
            <p className="text-sm text-muted-foreground font-bold">
              Manage food items for diet plans
            </p>
          </div>
          <Link
            href="/admin/food-database/create"
            className="btn-athletic inline-flex items-center justify-center gap-2 px-6 py-3 gradient-electric text-black glow-power"
          >
            <Plus className="h-5 w-5" />
            <span>Add Food Item</span>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="athletic-card p-6 pl-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by food name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-secondary border border-border text-foreground placeholder:text-muted-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="mt-3 text-sm text-muted-foreground font-bold">
          {filteredFoodItems.length} item{filteredFoodItems.length !== 1 ? "s" : ""} found
        </div>
      </div>

      {/* Food Items Table */}
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
              {searchQuery ? "No food items match your search" : "No food items found"}
            </p>
            {!searchQuery && (
              <Link
                href="/admin/food-database/create"
                className="btn-athletic inline-flex items-center gap-2 px-4 py-2 mt-4 gradient-electric text-black"
              >
                <Plus className="h-4 w-4" />
                <span>Add your first food item</span>
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
                      Calories
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                      Protein
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                      Serving Size
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground text-center">
                      Veg
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((item: FoodItem) => (
                    <TableRow key={item.id} className="border-border">
                      <TableCell>
                        <span className="font-bold">{item.name}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.calories} kcal</TableCell>
                      <TableCell className="text-muted-foreground">{item.protein}g</TableCell>
                      <TableCell className="text-muted-foreground">{item.serving_size}</TableCell>
                      <TableCell className="text-center">
                        {item.is_vegetarian && (
                          <div className="inline-flex items-center justify-center p-1 bg-neon-green/20">
                            <Leaf className="h-4 w-4 text-neon-green" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/food-database/edit/${item.id}`}
                            className="btn-athletic inline-flex items-center gap-2 px-3 py-2 bg-secondary text-foreground text-sm"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(item)}
                            className="btn-athletic inline-flex items-center gap-2 px-3 py-2 bg-destructive/20 text-red-500 text-sm hover:bg-destructive/30"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Delete</span>
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
        <DialogContent className="athletic-card p-0 max-w-md">
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
