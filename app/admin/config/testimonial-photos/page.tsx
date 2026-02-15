"use client";

import { useState, useEffect, useMemo } from "react";
import { useList, useDelete, useUpdate } from "@refinedev/core";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { useAuth } from "@/contexts/auth-context";
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
import type { TestimonialPhoto } from "@/lib/database.types";

/**
 * Get displayable image URL
 * Handles both static paths (/images/...) and Supabase storage paths
 */
function getImageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("/images/") || path.startsWith("http")) {
    return path;
  }
  // For storage paths, construct the public URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/testimonials/${path}`;
}

/**
 * Testimonial Photos Page
 * Lists all before/after transformation photos with search, reorder, and CRUD operations
 */
export default function TestimonialPhotosPage() {
  const { userId: adminId } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TestimonialPhoto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Fetch all photos
  const photosQuery = useList<TestimonialPhoto>({
    resource: "testimonial_photos",
    sorters: [{ field: "display_order", order: "asc" }],
    pagination: { mode: "off" },
    queryOptions: {
      enabled: !!adminId,
    },
  });

  // Delete mutation
  const deleteMutation = useDelete();
  const isDeleting = deleteMutation.mutation.isPending;

  // Update mutation for reordering
  const updateMutation = useUpdate();

  // Process data
  const photos = photosQuery.query.data?.data || [];

  // Filter photos based on search
  const filteredPhotos = useMemo(() => {
    if (!searchQuery) return photos;

    const query = searchQuery.toLowerCase();
    return photos.filter(
      (item: TestimonialPhoto) =>
        item.client_name.toLowerCase().includes(query) ||
        (item.profession && item.profession.toLowerCase().includes(query)) ||
        item.result.toLowerCase().includes(query)
    );
  }, [photos, searchQuery]);

  // Paginate
  const totalPages = Math.ceil(filteredPhotos.length / ADMIN_PAGE_SIZE);
  const paginatedItems = filteredPhotos.slice(
    (currentPage - 1) * ADMIN_PAGE_SIZE,
    currentPage * ADMIN_PAGE_SIZE
  );

  const isLoading = photosQuery.query.isLoading;

  // Handle delete confirmation
  const handleDeleteClick = (item: TestimonialPhoto) => {
    setItemToDelete(item);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  // Perform delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    // Delete images from storage if they are storage paths
    const supabase = createBrowserSupabaseClient();
    const pathsToDelete: string[] = [];

    if (itemToDelete.before_image_url && !itemToDelete.before_image_url.startsWith("/images/")) {
      pathsToDelete.push(itemToDelete.before_image_url);
    }
    if (itemToDelete.after_image_url && !itemToDelete.after_image_url.startsWith("/images/")) {
      pathsToDelete.push(itemToDelete.after_image_url);
    }

    if (pathsToDelete.length > 0) {
      await supabase.storage.from("testimonials").remove(pathsToDelete);
    }

    deleteMutation.mutate(
      {
        resource: "testimonial_photos",
        id: itemToDelete.id,
      },
      {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setItemToDelete(null);
          photosQuery.query.refetch();
        },
        onError: () => {
          setDeleteError("Failed to delete photo entry. Please try again.");
        },
      }
    );
  };

  // Handle reorder (move up/down)
  const handleReorder = async (item: TestimonialPhoto, direction: "up" | "down") => {
    const currentIndex = filteredPhotos.findIndex((p: TestimonialPhoto) => p.id === item.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= filteredPhotos.length) return;

    const targetItem = filteredPhotos[targetIndex];

    // Swap display_order values
    await Promise.all([
      updateMutation.mutateAsync({
        resource: "testimonial_photos",
        id: item.id,
        values: { display_order: targetItem.display_order },
      }),
      updateMutation.mutateAsync({
        resource: "testimonial_photos",
        id: targetItem.id,
        values: { display_order: item.display_order },
      }),
    ]);

    photosQuery.query.refetch();
  };

  // Toggle active status
  const handleToggleActive = async (item: TestimonialPhoto) => {
    updateMutation.mutate(
      {
        resource: "testimonial_photos",
        id: item.id,
        values: { is_active: !item.is_active },
      },
      {
        onSuccess: () => {
          photosQuery.query.refetch();
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
              Transformation <span className="gradient-athletic">Photos</span>
            </h1>
            <p className="text-sm text-muted-foreground font-bold">
              Manage before/after transformation photos for the landing page
            </p>
          </div>
          <Link
            href="/admin/config/testimonial-photos/create"
            className="btn-athletic inline-flex items-center justify-center gap-2 px-6 py-3 gradient-electric text-black glow-power"
          >
            <Plus className="h-5 w-5" />
            <span>Add Photo</span>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="athletic-card p-6 pl-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by client name, profession, or result..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-secondary border border-border text-foreground placeholder:text-muted-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="mt-3 text-sm text-muted-foreground font-bold">
          {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? "s" : ""} found
        </div>
      </div>

      {/* Photos Table */}
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
              {searchQuery ? "No photos match your search" : "No photos found"}
            </p>
            {!searchQuery && (
              <Link
                href="/admin/config/testimonial-photos/create"
                className="btn-athletic inline-flex items-center gap-2 px-4 py-2 mt-4 gradient-electric text-black"
              >
                <Plus className="h-4 w-4" />
                <span>Add your first photo</span>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground w-12">
                      #
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                      Photos
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                      Client
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                      Result
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground text-center">
                      Active
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground text-center">
                      Order
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground text-right w-32">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((item: TestimonialPhoto, index: number) => {
                    const beforeUrl = getImageUrl(item.before_image_url);
                    const afterUrl = getImageUrl(item.after_image_url);

                    return (
                      <TableRow key={item.id} className="border-border">
                        <TableCell className="text-muted-foreground">
                          {(currentPage - 1) * ADMIN_PAGE_SIZE + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="relative w-12 h-16 bg-secondary overflow-hidden flex-shrink-0">
                              {beforeUrl ? (
                                <Image
                                  src={beforeUrl}
                                  alt={`${item.client_name} before`}
                                  fill
                                  className="object-cover grayscale-[30%]"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[8px] text-center py-0.5">
                                Before
                              </div>
                            </div>
                            <div className="relative w-12 h-16 bg-secondary overflow-hidden flex-shrink-0 ring-1 ring-primary/30">
                              {afterUrl ? (
                                <Image
                                  src={afterUrl}
                                  alt={`${item.client_name} after`}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 gradient-electric text-black text-[8px] text-center py-0.5">
                                After
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="min-w-0">
                            <span className="font-bold block truncate">{item.client_name}</span>
                            {item.profession && (
                              <span className="text-xs text-muted-foreground block">
                                {item.profession}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground block">
                              {item.duration}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-bold text-foreground">{item.result}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            onClick={() => handleToggleActive(item)}
                            className="cursor-pointer"
                            title={item.is_active ? "Click to deactivate" : "Click to activate"}
                          >
                            {item.is_active ? (
                              <span className="inline-flex items-center justify-center px-2 py-1 bg-neon-green/20 text-neon-green text-xs font-bold uppercase">
                                Yes
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center px-2 py-1 bg-destructive/20 text-red-500 text-xs font-bold uppercase">
                                No
                              </span>
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleReorder(item, "up")}
                              disabled={index === 0}
                              className="p-1 rounded hover:bg-secondary transition-colors disabled:opacity-30"
                              title="Move up"
                            >
                              <ArrowUp className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </button>
                            <span className="text-xs font-bold text-muted-foreground w-8">
                              {item.display_order}
                            </span>
                            <button
                              onClick={() => handleReorder(item, "down")}
                              disabled={index === paginatedItems.length - 1}
                              className="p-1 rounded hover:bg-secondary transition-colors disabled:opacity-30"
                              title="Move down"
                            >
                              <ArrowDown className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/config/testimonial-photos/edit/${item.id}`}
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
                Delete <span className="gradient-athletic">{itemToDelete?.client_name}</span>&apos;s
                photo?
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-bold mt-2">
                This will permanently delete both before and after photos. This action cannot be
                undone.
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
