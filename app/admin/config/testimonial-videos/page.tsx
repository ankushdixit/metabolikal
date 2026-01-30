"use client";

import { useState, useEffect, useMemo } from "react";
import { useList, useDelete, useUpdate } from "@refinedev/core";
import Link from "next/link";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUp,
  ArrowDown,
  ExternalLink,
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
import { TESTIMONIAL_VIDEO_TYPES } from "@/lib/validations";
import { getYouTubeThumbnail, getYouTubeWatchUrl } from "@/lib/utils/youtube";
import type { TestimonialVideo } from "@/lib/database.types";

/**
 * Testimonial Videos Page
 * Lists all YouTube testimonial videos with search, filter, reorder, and CRUD operations
 */
export default function TestimonialVideosPage() {
  const [adminId, setAdminId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TestimonialVideo | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Get current admin user ID
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      if (data.user) {
        setAdminId(data.user.id);
      }
    });
  }, []);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter]);

  // Fetch all videos
  const videosQuery = useList<TestimonialVideo>({
    resource: "testimonial_videos",
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
  const videos = videosQuery.query.data?.data || [];

  // Filter videos based on search and type
  const filteredVideos = useMemo(() => {
    let result = videos;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item: TestimonialVideo) =>
          item.title.toLowerCase().includes(query) ||
          (item.client_name && item.client_name.toLowerCase().includes(query)) ||
          item.youtube_video_id.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (typeFilter) {
      result = result.filter((item: TestimonialVideo) => item.video_type === typeFilter);
    }

    return result;
  }, [videos, searchQuery, typeFilter]);

  // Paginate
  const totalPages = Math.ceil(filteredVideos.length / ADMIN_PAGE_SIZE);
  const paginatedItems = filteredVideos.slice(
    (currentPage - 1) * ADMIN_PAGE_SIZE,
    currentPage * ADMIN_PAGE_SIZE
  );

  const isLoading = videosQuery.query.isLoading;

  // Handle delete confirmation
  const handleDeleteClick = (item: TestimonialVideo) => {
    setItemToDelete(item);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  // Perform delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    deleteMutation.mutate(
      {
        resource: "testimonial_videos",
        id: itemToDelete.id,
      },
      {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setItemToDelete(null);
          videosQuery.query.refetch();
        },
        onError: () => {
          setDeleteError("Failed to delete video. Please try again.");
        },
      }
    );
  };

  // Handle reorder (move up/down)
  const handleReorder = async (item: TestimonialVideo, direction: "up" | "down") => {
    const currentIndex = filteredVideos.findIndex((v: TestimonialVideo) => v.id === item.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= filteredVideos.length) return;

    const targetItem = filteredVideos[targetIndex];

    // Swap display_order values
    await Promise.all([
      updateMutation.mutateAsync({
        resource: "testimonial_videos",
        id: item.id,
        values: { display_order: targetItem.display_order },
      }),
      updateMutation.mutateAsync({
        resource: "testimonial_videos",
        id: targetItem.id,
        values: { display_order: item.display_order },
      }),
    ]);

    videosQuery.query.refetch();
  };

  // Toggle active status
  const handleToggleActive = async (item: TestimonialVideo) => {
    updateMutation.mutate(
      {
        resource: "testimonial_videos",
        id: item.id,
        values: { is_active: !item.is_active },
      },
      {
        onSuccess: () => {
          videosQuery.query.refetch();
        },
      }
    );
  };

  // Get type label
  const getTypeLabel = (value: string) => {
    const type = TESTIMONIAL_VIDEO_TYPES.find((t) => t.value === value);
    return type?.label || value;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              Testimonial <span className="gradient-athletic">Videos</span>
            </h1>
            <p className="text-sm text-muted-foreground font-bold">
              Manage YouTube video testimonials for the landing page
            </p>
          </div>
          <Link
            href="/admin/config/testimonial-videos/create"
            className="btn-athletic inline-flex items-center justify-center gap-2 px-6 py-3 gradient-electric text-black glow-power"
          >
            <Plus className="h-5 w-5" />
            <span>Add Video</span>
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
              placeholder="Search by title, client name, or video ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-secondary border border-border text-foreground placeholder:text-muted-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="pl-12 pr-8 py-3 bg-secondary border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer min-w-[180px]"
            >
              <option value="">All Types</option>
              {TESTIMONIAL_VIDEO_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 text-sm text-muted-foreground font-bold">
          {filteredVideos.length} video{filteredVideos.length !== 1 ? "s" : ""} found
        </div>
      </div>

      {/* Videos Table */}
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
              {searchQuery || typeFilter ? "No videos match your search" : "No videos found"}
            </p>
            {!searchQuery && !typeFilter && (
              <Link
                href="/admin/config/testimonial-videos/create"
                className="btn-athletic inline-flex items-center gap-2 px-4 py-2 mt-4 gradient-electric text-black"
              >
                <Plus className="h-4 w-4" />
                <span>Add your first video</span>
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
                      Video
                    </TableHead>
                    <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                      Type
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
                  {paginatedItems.map((item: TestimonialVideo, index: number) => (
                    <TableRow key={item.id} className="border-border">
                      <TableCell className="text-muted-foreground">
                        {(currentPage - 1) * ADMIN_PAGE_SIZE + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative w-20 h-12 bg-secondary overflow-hidden flex-shrink-0">
                            <img
                              src={getYouTubeThumbnail(item.youtube_video_id, "default")}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold block truncate">{item.title}</span>
                            {item.client_name && (
                              <span className="text-xs text-muted-foreground block">
                                {item.client_name}
                              </span>
                            )}
                            <a
                              href={getYouTubeWatchUrl(item.youtube_video_id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" />
                              {item.youtube_video_id}
                            </a>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <span className="px-2 py-1 bg-secondary text-xs font-bold uppercase tracking-wider">
                          {getTypeLabel(item.video_type)}
                        </span>
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
                            href={`/admin/config/testimonial-videos/edit/${item.id}`}
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
                Delete <span className="gradient-athletic">{itemToDelete?.title}</span>?
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
