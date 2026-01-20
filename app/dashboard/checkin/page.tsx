"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreate, useList } from "@refinedev/core";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Flame,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
  History,
} from "lucide-react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { checkInSchema, type CheckInFormData } from "@/lib/validations";
import {
  MeasurementsStep,
  PhotosStep,
  RatingsStep,
  NotesStep,
} from "@/components/dashboard/checkin-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Profile {
  full_name?: string;
  created_at?: string;
}

interface CheckIn {
  id: string;
  submitted_at: string;
}

const STEPS = ["Measurements", "Photos", "Ratings", "Notes"];

/**
 * Check-In Page
 * Multi-step form for weekly client check-ins
 */
export default function CheckInPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [dayNumber, setDayNumber] = useState(1);
  const [currentStep, setCurrentStep] = useState(0);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form setup with default values
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<CheckInFormData>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      energy_rating: 5,
      sleep_rating: 5,
      stress_rating: 5,
      mood_rating: 5,
      diet_adherence: 80,
      workout_adherence: 80,
      photo_front: null,
      photo_side: null,
      photo_back: null,
    },
  });

  // Get current user ID
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      }
    });
  }, []);

  // Fetch profile to calculate day number
  const profileQuery = useList<Profile>({
    resource: "profiles",
    filters: [{ field: "id", operator: "eq", value: userId || "" }],
    queryOptions: {
      enabled: !!userId,
    },
  });

  // Calculate day number from profile creation date
  useEffect(() => {
    const profile = profileQuery.query.data?.data?.[0];
    if (profile?.created_at) {
      const today = new Date();
      const startDate = new Date(profile.created_at);
      const calculatedDay =
        Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      setDayNumber(calculatedDay);
    }
  }, [profileQuery.query.data]);

  // Check for existing check-in this week
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const existingCheckInQuery = useList<CheckIn>({
    resource: "check_ins",
    filters: [
      { field: "client_id", operator: "eq", value: userId || "" },
      { field: "submitted_at", operator: "gte", value: startOfWeek.toISOString() },
    ],
    queryOptions: {
      enabled: !!userId,
    },
  });

  const hasExistingCheckIn = (existingCheckInQuery.query.data?.data?.length || 0) > 0;

  // Create mutation
  const createMutation = useCreate();

  // Handle photo changes
  const handlePhotoChange = useCallback(
    (view: "front" | "side" | "back", url: string | null) => {
      const fieldName =
        view === "front" ? "photo_front" : view === "side" ? "photo_side" : "photo_back";
      setValue(fieldName, url);
    },
    [setValue]
  );

  // Navigation between steps
  const handleNext = useCallback(async () => {
    // Validate current step before proceeding
    if (currentStep === 0) {
      const isValid = await trigger("weight");
      if (!isValid) return;
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, trigger]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Form submission
  const onSubmit = useCallback(
    async (data: CheckInFormData) => {
      if (!userId) return;

      // Check for duplicate and show warning if needed
      if (hasExistingCheckIn && !showDuplicateWarning) {
        setShowDuplicateWarning(true);
        return;
      }

      // Close warning dialog if open
      setShowDuplicateWarning(false);

      createMutation.mutate(
        {
          resource: "check_ins",
          values: {
            client_id: userId,
            weight: data.weight,
            body_fat_percent: data.body_fat_percent || null,
            chest_cm: data.chest_cm || null,
            waist_cm: data.waist_cm || null,
            hips_cm: data.hips_cm || null,
            arms_cm: data.arms_cm || null,
            thighs_cm: data.thighs_cm || null,
            photo_front: data.photo_front || null,
            photo_side: data.photo_side || null,
            photo_back: data.photo_back || null,
            energy_rating: data.energy_rating,
            sleep_rating: data.sleep_rating,
            stress_rating: data.stress_rating,
            mood_rating: data.mood_rating,
            diet_adherence: data.diet_adherence,
            workout_adherence: data.workout_adherence,
            challenges: data.challenges || null,
            progress_notes: data.progress_notes || null,
            questions: data.questions || null,
          },
        },
        {
          onSuccess: () => {
            setSubmitSuccess(true);
            // Redirect after a short delay to show success message
            setTimeout(() => {
              router.push("/dashboard/checkin/history");
            }, 1500);
          },
        }
      );
    },
    [userId, hasExistingCheckIn, showDuplicateWarning, createMutation, router]
  );

  // Watch photo values for the photos step
  const photoFront = watch("photo_front");
  const photoSide = watch("photo_side");
  const photoBack = watch("photo_back");

  // Format date
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isLoading = profileQuery.query.isLoading;
  const isSubmitting = createMutation.mutation.isPending;

  // Render step content
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <MeasurementsStep register={register} errors={errors} currentDate={formattedDate} />;
      case 1:
        return userId ? (
          <PhotosStep
            userId={userId}
            photoFront={photoFront ?? null}
            photoSide={photoSide ?? null}
            photoBack={photoBack ?? null}
            onPhotoChange={handlePhotoChange}
          />
        ) : null;
      case 2:
        return <RatingsStep watch={watch} setValue={setValue} />;
      case 3:
        return <NotesStep register={register} watch={watch} setValue={setValue} errors={errors} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              Weekly <span className="gradient-athletic">Check-In</span>
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-bold">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-secondary">
                <Flame className="h-4 w-4 text-primary" />
                <span className="uppercase tracking-wider">Day {dayNumber}</span>
              </div>
            </div>
          </div>

          {/* View History Link */}
          <Link
            href="/dashboard/checkin/history"
            className="btn-athletic flex items-center justify-center gap-2 px-5 py-3 bg-secondary text-foreground"
          >
            <History className="h-4 w-4" />
            <span>View History</span>
          </Link>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 font-black text-sm ${
                  index < currentStep
                    ? "bg-neon-green text-black"
                    : index === currentStep
                      ? "gradient-electric text-black"
                      : "bg-secondary text-muted-foreground"
                }`}
              >
                {index < currentStep ? <Check className="h-5 w-5" /> : index + 1}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`hidden md:block w-16 lg:w-24 h-1 mx-2 ${
                    index < currentStep ? "bg-neon-green" : "bg-secondary"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="hidden md:flex items-center justify-between mt-2">
          {STEPS.map((step) => (
            <span
              key={step}
              className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground text-center w-10"
            >
              {step}
            </span>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="athletic-card p-8 pl-10 animate-pulse">
          <div className="h-4 w-48 bg-secondary mb-6" />
          <div className="space-y-4">
            <div className="h-12 bg-secondary" />
            <div className="h-12 bg-secondary" />
            <div className="h-12 bg-secondary" />
          </div>
        </div>
      )}

      {/* Success Message */}
      {submitSuccess && (
        <div className="athletic-card p-8 pl-10 text-center">
          <div className="p-4 bg-neon-green/20 inline-block mb-4">
            <Check className="h-8 w-8 text-neon-green" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight mb-2 text-neon-green">
            Check-In Submitted Successfully!
          </h3>
          <p className="text-muted-foreground font-bold">Redirecting to history...</p>
        </div>
      )}

      {/* Form Content */}
      {!isLoading && !submitSuccess && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="athletic-card p-6 pl-8">{renderStep()}</div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`btn-athletic flex items-center gap-2 px-5 py-3 ${
                currentStep === 0
                  ? "bg-secondary/50 text-muted-foreground cursor-not-allowed"
                  : "bg-secondary text-foreground"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-athletic flex items-center gap-2 px-6 py-3 gradient-electric text-black glow-power"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-athletic flex items-center gap-2 px-6 py-3 gradient-electric text-black glow-power disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Submit Check-In</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      )}

      {/* Duplicate Warning Dialog */}
      <Dialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-500/20">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">
                Check-In Already Submitted
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground font-bold">
              You&apos;ve already submitted a check-in this week. Submit anyway?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={() => setShowDuplicateWarning(false)}
              className="btn-athletic px-5 py-3 bg-secondary text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(onSubmit)()}
              className="btn-athletic px-5 py-3 gradient-electric text-black"
            >
              Submit Anyway
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
