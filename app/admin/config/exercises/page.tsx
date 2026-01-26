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
  Dumbbell,
  Filter,
  Star,
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
import { EXERCISE_CATEGORIES, MUSCLE_GROUPS } from "@/lib/validations";
import type { Exercise } from "@/lib/database.types";

const PAGE_SIZE = 10;

/**
 * Exercises Library Page
 * Lists all exercises with search, filter, and CRUD operations
 */
export default function ExercisesLibraryPage() {
  const [adminId, setAdminId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Exercise | null>(null);
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
  }, [searchQuery, categoryFilter, muscleGroupFilter]);

  // Fetch all exercises
  const exercisesQuery = useList<Exercise>({
    resource: "exercises",
    sorters: [{ field: "name", order: "asc" }],
    queryOptions: {
      enabled: !!adminId,
    },
  });

  // Delete mutation
  const deleteMutation = useDelete();
  const isDeleting = deleteMutation.mutation.isPending;

  // Process data
  const exercises = exercisesQuery.query.data?.data || [];

  // Filter exercises based on search, category, and muscle group
  const filteredExercises = useMemo(() => {
    let result = exercises;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item: Exercise) => item.name.toLowerCase().includes(query));
    }

    // Filter by category
    if (categoryFilter) {
      result = result.filter((item: Exercise) => item.category === categoryFilter);
    }

    // Filter by muscle group
    if (muscleGroupFilter) {
      result = result.filter((item: Exercise) => item.muscle_group === muscleGroupFilter);
    }

    return result;
  }, [exercises, searchQuery, categoryFilter, muscleGroupFilter]);

  // Paginate
  const totalPages = Math.ceil(filteredExercises.length / PAGE_SIZE);
  const paginatedItems = filteredExercises.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const isLoading = exercisesQuery.query.isLoading;

  // Handle delete confirmation
  const handleDeleteClick = (item: Exercise) => {
    setItemToDelete(item);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  // Perform soft delete (set is_active = false)
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    // Check if exercise is used in active workout_plans
    const supabase = createBrowserSupabaseClient();

    const { count: planCount } = await supabase
      .from("workout_plans")
      .select("*", { count: "exact", head: true })
      .eq("exercise_id", itemToDelete.id);

    if (planCount && planCount > 0) {
      setDeleteError(
        `Warning: This exercise is used in ${planCount} workout plan${planCount > 1 ? "s" : ""}. Deactivating instead of deleting.`
      );
    }

    // Soft delete by updating is_active to false
    const { error } = await supabase
      .from("exercises")
      .update({ is_active: false })
      .eq("id", itemToDelete.id);

    if (error) {
      setDeleteError("Failed to deactivate exercise. Please try again.");
      return;
    }

    setDeleteDialogOpen(false);
    setItemToDelete(null);
    exercisesQuery.query.refetch();
  };

  // Get category label
  const getCategoryLabel = (value: string) => {
    const category = EXERCISE_CATEGORIES.find((c) => c.value === value);
    return category?.label || value;
  };

  // Get muscle group label
  const getMuscleGroupLabel = (value: string) => {
    const group = MUSCLE_GROUPS.find((g) => g.value === value);
    return group?.label || value;
  };

  // Format sets/reps display
  const formatSetsReps = (exercise: Exercise) => {
    if (exercise.default_sets && exercise.default_reps) {
      return `${exercise.default_sets}x${exercise.default_reps}`;
    }
    if (exercise.default_duration_seconds) {
      const minutes = Math.floor(exercise.default_duration_seconds / 60);
      const seconds = exercise.default_duration_seconds % 60;
      if (minutes > 0 && seconds > 0) {
        return `${minutes}m ${seconds}s`;
      }
      if (minutes > 0) {
        return `${minutes} min`;
      }
      return `${seconds}s`;
    }
    return "-";
  };

  // Render difficulty stars
  const renderDifficulty = (level: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              "h-3 w-3",
              i <= level ? "text-primary fill-primary" : "text-muted-foreground"
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              Exercises <span className="gradient-athletic">Library</span>
            </h1>
            <p className="text-sm text-muted-foreground font-bold">
              Manage exercise definitions for workout plans
            </p>
          </div>
          <Link
            href="/admin/config/exercises/create"
            className="btn-athletic inline-flex items-center justify-center gap-2 px-6 py-3 gradient-electric text-black glow-power"
          >
            <Plus className="h-5 w-5" />
            <span>Add Exercise</span>
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
              placeholder="Search by exercise name..."
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
              {EXERCISE_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Muscle Group Filter */}
          <div className="relative">
            <Dumbbell className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <select
              value={muscleGroupFilter}
              onChange={(e) => setMuscleGroupFilter(e.target.value)}
              className="pl-12 pr-8 py-3 bg-secondary border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="">All Muscles</option>
              {MUSCLE_GROUPS.map((group) => (
                <option key={group.value} value={group.value}>
                  {group.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 text-sm text-muted-foreground font-bold">
          {filteredExercises.length} exercise{filteredExercises.length !== 1 ? "s" : ""} found
        </div>
      </div>

      {/* Exercises Table */}
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
              {searchQuery || categoryFilter || muscleGroupFilter
                ? "No exercises match your search"
                : "No exercises found"}
            </p>
            {!searchQuery && !categoryFilter && !muscleGroupFilter && (
              <Link
                href="/admin/config/exercises/create"
                className="btn-athletic inline-flex items-center gap-2 px-4 py-2 mt-4 gradient-electric text-black"
              >
                <Plus className="h-4 w-4" />
                <span>Add your first exercise</span>
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
                      Muscle
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                      Equipment
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                      Sets/Reps
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                      Difficulty
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
                  {paginatedItems.map((item: Exercise) => (
                    <TableRow key={item.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10">
                            <Dumbbell className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-bold">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <span className="px-2 py-1 bg-secondary text-xs font-bold uppercase tracking-wider">
                          {getCategoryLabel(item.category)}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <span className="px-2 py-1 bg-secondary text-xs font-bold uppercase tracking-wider">
                          {getMuscleGroupLabel(item.muscle_group)}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.equipment || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-bold">
                        {formatSetsReps(item)}
                      </TableCell>
                      <TableCell>{renderDifficulty(item.difficulty_level)}</TableCell>
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
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/config/exercises/edit/${item.id}`}
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
        <DialogContent className="athletic-card p-0 sm:max-w-md">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">
                Deactivate <span className="gradient-athletic">{itemToDelete?.name}</span>?
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-bold mt-2">
                This will set the exercise as inactive. It will no longer appear in new workout
                plans.
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
