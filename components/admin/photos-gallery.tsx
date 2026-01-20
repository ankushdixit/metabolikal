"use client";

import { useState, useMemo } from "react";
import { Image as ImageIcon, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { CheckIn } from "@/lib/database.types";

interface PhotosGalleryProps {
  checkIns: CheckIn[];
}

type PhotoView = "front" | "side" | "back";

/**
 * Photos gallery component
 * Displays progress photos grouped by check-in date with compare mode
 */
export function PhotosGallery({ checkIns }: PhotosGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<[string | null, string | null]>([null, null]);
  const [compareView, setCompareView] = useState<PhotoView>("front");

  // Filter check-ins with photos and prepare data
  const checkInsWithPhotos = useMemo(() => {
    return checkIns
      .filter((c) => c.photo_front || c.photo_side || c.photo_back)
      .map((c) => ({
        id: c.id,
        date: c.submitted_at,
        photos: {
          front: c.photo_front,
          side: c.photo_side,
          back: c.photo_back,
        },
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [checkIns]);

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Handle date selection for compare mode
  const handleDateSelect = (date: string) => {
    if (!compareMode) return;

    if (selectedDates[0] === date) {
      setSelectedDates([null, selectedDates[1]]);
    } else if (selectedDates[1] === date) {
      setSelectedDates([selectedDates[0], null]);
    } else if (!selectedDates[0]) {
      setSelectedDates([date, selectedDates[1]]);
    } else if (!selectedDates[1]) {
      setSelectedDates([selectedDates[0], date]);
    } else {
      // Replace the first selected date
      setSelectedDates([date, selectedDates[1]]);
    }
  };

  // Get photos for selected dates
  const getComparePhotos = () => {
    const date1 = checkInsWithPhotos.find((c) => c.date === selectedDates[0]);
    const date2 = checkInsWithPhotos.find((c) => c.date === selectedDates[1]);
    return { date1, date2 };
  };

  const comparePhotos = getComparePhotos();

  // Toggle compare mode
  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    setSelectedDates([null, null]);
  };

  if (checkInsWithPhotos.length === 0) {
    return (
      <div className="athletic-card p-8 pl-10 text-center">
        <div className="p-4 bg-secondary inline-block mb-4">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-bold">No progress photos available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Compare Button */}
      <div className="athletic-card p-4 pl-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-black uppercase tracking-tight">
              Progress <span className="gradient-athletic">Photos</span>
            </h2>
          </div>
          <button
            onClick={toggleCompareMode}
            className={cn(
              "btn-athletic flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider",
              compareMode
                ? "gradient-electric text-black"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>{compareMode ? "Exit Compare" : "Compare"}</span>
          </button>
        </div>
      </div>

      {/* Compare Mode Instructions */}
      {compareMode && (
        <div className="athletic-card p-4 pl-8">
          <p className="text-sm text-muted-foreground font-bold">
            Select two dates to compare progress photos side-by-side.
            {selectedDates[0] && selectedDates[1]
              ? " Both dates selected - view comparison below."
              : selectedDates[0]
                ? " Select one more date."
                : " Select the first date."}
          </p>
        </div>
      )}

      {/* Compare View */}
      {compareMode && selectedDates[0] && selectedDates[1] && (
        <div className="athletic-card p-6 pl-8">
          {/* View Selector */}
          <div className="flex gap-2 mb-6">
            {(["front", "side", "back"] as PhotoView[]).map((view) => (
              <button
                key={view}
                onClick={() => setCompareView(view)}
                className={cn(
                  "btn-athletic px-4 py-2 text-sm font-bold uppercase tracking-wider",
                  compareView === view
                    ? "gradient-electric text-black"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {view}
              </button>
            ))}
          </div>

          {/* Side-by-side Comparison */}
          <div className="grid grid-cols-2 gap-6">
            {/* First Date */}
            <div>
              <p className="text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">
                {comparePhotos.date1 ? formatDate(comparePhotos.date1.date) : "—"}
              </p>
              <div className="aspect-[3/4] bg-secondary relative overflow-hidden">
                {comparePhotos.date1?.photos[compareView] ? (
                  <img
                    src={comparePhotos.date1.photos[compareView]!}
                    alt={`${compareView} view`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">No photo</p>
                  </div>
                )}
              </div>
            </div>

            {/* Second Date */}
            <div>
              <p className="text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">
                {comparePhotos.date2 ? formatDate(comparePhotos.date2.date) : "—"}
              </p>
              <div className="aspect-[3/4] bg-secondary relative overflow-hidden">
                {comparePhotos.date2?.photos[compareView] ? (
                  <img
                    src={comparePhotos.date2.photos[compareView]!}
                    alt={`${compareView} view`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">No photo</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Gallery */}
      {checkInsWithPhotos.map((checkIn) => (
        <div
          key={checkIn.id}
          className={cn(
            "athletic-card p-6 pl-8",
            compareMode && "cursor-pointer hover:border-primary transition-colors",
            compareMode &&
              (selectedDates[0] === checkIn.date || selectedDates[1] === checkIn.date) &&
              "border-primary ring-2 ring-primary/30"
          )}
          onClick={() => handleDateSelect(checkIn.date)}
        >
          {/* Date Header */}
          <div className="flex items-center justify-between mb-4">
            <p className="font-black text-sm uppercase tracking-wider">
              {formatDate(checkIn.date)}
            </p>
            {compareMode &&
              (selectedDates[0] === checkIn.date || selectedDates[1] === checkIn.date) && (
                <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-bold uppercase">
                  Selected
                </span>
              )}
          </div>

          {/* Photos Grid */}
          <div className="grid grid-cols-3 gap-4">
            {(["front", "side", "back"] as PhotoView[]).map((view) => {
              const photo = checkIn.photos[view];
              return (
                <div
                  key={view}
                  className={cn(
                    "aspect-[3/4] bg-secondary relative overflow-hidden",
                    photo && !compareMode && "cursor-pointer hover:opacity-90"
                  )}
                  onClick={(e) => {
                    if (photo && !compareMode) {
                      e.stopPropagation();
                      setSelectedPhoto(photo);
                    }
                  }}
                >
                  {photo ? (
                    <>
                      <img
                        src={photo}
                        alt={`${view} view`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs font-bold uppercase">
                        {view}
                      </span>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center flex-col gap-2">
                      <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground/50 uppercase">{view}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Photo Lightbox */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl bg-card border-border p-0">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle className="text-lg font-black uppercase tracking-tight">
              Progress Photo
            </DialogTitle>
          </DialogHeader>
          <div className="relative aspect-[3/4] max-h-[80vh]">
            {selectedPhoto && (
              <img
                src={selectedPhoto}
                alt="Progress photo"
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
