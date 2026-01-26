"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdate, useCreate, useDeleteMany } from "@refinedev/core";
import { Pencil, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { updateClientSchema, type UpdateClientFormData } from "@/lib/validations";
import { useMedicalConditions } from "@/hooks/use-medical-conditions";
import { createBrowserSupabaseClient } from "@/lib/auth";
import type { Profile, ClientCondition } from "@/lib/database.types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  client: Profile;
  clientConditions?: ClientCondition[];
}

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

const DURATION_PRESETS = [7, 14, 21, 28, 30, 60, 90] as const;

/**
 * Modal for editing an existing client profile
 * Allows updating personal info, plan settings, and medical conditions
 */
export function EditClientModal({
  isOpen,
  onClose,
  onSuccess,
  client,
  clientConditions = [],
}: EditClientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [customDuration, setCustomDuration] = useState<string>("");
  const [showConditionsDropdown, setShowConditionsDropdown] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);

  const { conditions, isLoading: conditionsLoading } = useMedicalConditions();

  // Get current admin user ID
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setAdminId(data.user.id);
      }
    });
  }, []);

  // Extract current condition IDs from the client's conditions
  const currentConditionIds = useMemo(
    () => clientConditions.map((cc) => cc.condition_id),
    [clientConditions]
  );

  // Refine hooks for updating data
  const { mutateAsync: updateProfile } = useUpdate();
  const { mutateAsync: createCondition } = useCreate();
  const { mutateAsync: deleteConditions } = useDeleteMany();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateClientFormData>({
    resolver: zodResolver(updateClientSchema),
    defaultValues: {
      full_name: client.full_name,
      email: client.email,
      phone: client.phone ?? "",
      date_of_birth: client.date_of_birth ?? "",
      gender: client.gender,
      address: client.address ?? "",
      plan_start_date: client.plan_start_date ?? "",
      plan_duration_days: client.plan_duration_days ?? 7,
      condition_ids: currentConditionIds,
    },
  });

  // Reset form when client or conditions change
  useEffect(() => {
    if (isOpen) {
      reset({
        full_name: client.full_name,
        email: client.email,
        phone: client.phone ?? "",
        date_of_birth: client.date_of_birth ?? "",
        gender: client.gender,
        address: client.address ?? "",
        plan_start_date: client.plan_start_date ?? "",
        plan_duration_days: client.plan_duration_days ?? 7,
        condition_ids: currentConditionIds,
      });
      setCustomDuration("");
      setServerError(null);
      setShowConditionsDropdown(false);
    }
  }, [isOpen, client, currentConditionIds, reset]);

  const selectedGender = watch("gender");
  const selectedDuration = watch("plan_duration_days");
  const selectedConditionIds = watch("condition_ids") ?? [];

  // Reset custom duration when a preset is selected
  useEffect(() => {
    if (DURATION_PRESETS.includes(selectedDuration as (typeof DURATION_PRESETS)[number])) {
      setCustomDuration("");
    }
  }, [selectedDuration]);

  const handleDurationPresetClick = (days: number) => {
    setValue("plan_duration_days", days);
  };

  const handleCustomDurationChange = (value: string) => {
    setCustomDuration(value);
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 365) {
      setValue("plan_duration_days", numValue);
    }
  };

  const toggleCondition = (conditionId: string) => {
    const current = selectedConditionIds;
    if (current.includes(conditionId)) {
      setValue(
        "condition_ids",
        current.filter((id) => id !== conditionId)
      );
    } else {
      setValue("condition_ids", [...current, conditionId]);
    }
  };

  const removeCondition = (conditionId: string) => {
    setValue(
      "condition_ids",
      selectedConditionIds.filter((id) => id !== conditionId)
    );
  };

  const getConditionName = (conditionId: string) => {
    return conditions.find((c) => c.id === conditionId)?.name ?? conditionId;
  };

  const handleFormSubmit = async (data: UpdateClientFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      // 1. Update the profile
      await updateProfile({
        resource: "profiles",
        id: client.id,
        values: {
          full_name: data.full_name,
          email: data.email,
          phone: data.phone || null,
          date_of_birth: data.date_of_birth || null,
          gender: data.gender || null,
          address: data.address || null,
          plan_start_date: data.plan_start_date || null,
          plan_duration_days: data.plan_duration_days ?? 7,
          updated_at: new Date().toISOString(),
        },
      });

      // 2. Sync conditions
      const newConditionIds = data.condition_ids ?? [];
      const conditionsToAdd = newConditionIds.filter((id) => !currentConditionIds.includes(id));
      const conditionsToRemove = currentConditionIds.filter((id) => !newConditionIds.includes(id));

      // Delete removed conditions
      if (conditionsToRemove.length > 0) {
        const idsToDelete = clientConditions
          .filter((cc) => conditionsToRemove.includes(cc.condition_id))
          .map((cc) => cc.id);

        if (idsToDelete.length > 0) {
          await deleteConditions({
            resource: "client_conditions",
            ids: idsToDelete,
          });
        }
      }

      // Add new conditions
      for (const conditionId of conditionsToAdd) {
        try {
          await createCondition({
            resource: "client_conditions",
            values: {
              client_id: client.id,
              condition_id: conditionId,
              created_by: adminId,
            },
          });
        } catch (err) {
          // Log but don't fail - condition might already exist or other non-critical error
          console.error("Failed to add condition:", err);
        }
      }

      // Success
      toast.success("Client profile updated successfully!");
      onClose();
      onSuccess?.();
    } catch (err) {
      console.error("Failed to update client:", err);
      setServerError(
        err instanceof Error ? err.message : "Failed to update client profile. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-card p-0 max-h-[85vh] flex flex-col">
        {/* Top accent */}
        <div className="h-1 gradient-electric" />

        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-black uppercase tracking-tight">
            Edit <span className="gradient-athletic">Client Profile</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm">
            Update client information, plan settings, and medical conditions.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="p-6 space-y-4 flex-1 overflow-y-auto"
        >
          {/* Server Error */}
          {serverError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold">
              {serverError}
            </div>
          )}

          {/* Personal Information Section */}
          <div className="border-b border-border pb-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Personal Information
            </h3>
          </div>

          {/* Full Name */}
          <div>
            <Label
              htmlFor="full_name"
              className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block"
            >
              Full Name *
            </Label>
            <Input
              id="full_name"
              {...register("full_name")}
              placeholder="e.g., John Doe"
              className={cn("bg-secondary border-border", errors.full_name && "border-destructive")}
              disabled={isSubmitting}
            />
            {errors.full_name && (
              <p className="text-destructive text-xs mt-1 font-bold">{errors.full_name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <Label
              htmlFor="email"
              className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block"
            >
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="e.g., john@example.com"
              className={cn("bg-secondary border-border", errors.email && "border-destructive")}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-destructive text-xs mt-1 font-bold">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <Label
              htmlFor="phone"
              className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block"
            >
              Phone
            </Label>
            <Input
              id="phone"
              type="tel"
              {...register("phone")}
              placeholder="e.g., +919876543210"
              className={cn("bg-secondary border-border", errors.phone && "border-destructive")}
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="text-destructive text-xs mt-1 font-bold">{errors.phone.message}</p>
            )}
          </div>

          {/* Date of Birth and Gender - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date of Birth */}
            <div>
              <Label
                htmlFor="date_of_birth"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block"
              >
                Date of Birth
              </Label>
              <Input
                id="date_of_birth"
                type="date"
                {...register("date_of_birth")}
                className={cn(
                  "bg-secondary border-border",
                  errors.date_of_birth && "border-destructive"
                )}
                disabled={isSubmitting}
              />
              {errors.date_of_birth && (
                <p className="text-destructive text-xs mt-1 font-bold">
                  {errors.date_of_birth.message}
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <Label
                htmlFor="gender"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block"
              >
                Gender
              </Label>
              <Select
                value={selectedGender ?? ""}
                onValueChange={(value) =>
                  setValue("gender", value as UpdateClientFormData["gender"])
                }
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="gender"
                  className={cn(
                    "bg-secondary border-border",
                    errors.gender && "border-destructive"
                  )}
                >
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-destructive text-xs mt-1 font-bold">{errors.gender.message}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <Label
              htmlFor="address"
              className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block"
            >
              Address
            </Label>
            <textarea
              id="address"
              {...register("address")}
              placeholder="Enter client address (optional)"
              className={cn(
                "w-full p-3 bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none h-20",
                errors.address && "border-destructive"
              )}
              disabled={isSubmitting}
            />
            {errors.address && (
              <p className="text-destructive text-xs mt-1 font-bold">{errors.address.message}</p>
            )}
          </div>

          {/* Plan Settings Section Divider */}
          <div className="border-t border-border pt-4 mt-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
              Plan Settings
            </h3>
          </div>

          {/* Plan Start Date */}
          <div>
            <Label
              htmlFor="plan_start_date"
              className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block"
            >
              Plan Start Date
            </Label>
            <Input
              id="plan_start_date"
              type="date"
              {...register("plan_start_date")}
              className={cn(
                "bg-secondary border-border",
                errors.plan_start_date && "border-destructive"
              )}
              disabled={isSubmitting}
            />
            <p className="text-muted-foreground text-xs mt-1">When does Day 1 begin?</p>
            {errors.plan_start_date && (
              <p className="text-destructive text-xs mt-1 font-bold">
                {errors.plan_start_date.message}
              </p>
            )}
          </div>

          {/* Plan Duration */}
          <div>
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              Plan Duration
            </Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {DURATION_PRESETS.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handleDurationPresetClick(days)}
                  disabled={isSubmitting}
                  className={cn(
                    "px-3 py-1.5 text-sm font-bold border transition-colors",
                    selectedDuration === days && !customDuration
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary border-border hover:bg-secondary/80 text-foreground"
                  )}
                >
                  {days}
                </button>
              ))}
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={customDuration}
                  onChange={(e) => handleCustomDurationChange(e.target.value)}
                  placeholder="Custom"
                  className={cn(
                    "w-20 h-8 text-sm bg-secondary border-border",
                    customDuration && "border-primary"
                  )}
                  disabled={isSubmitting}
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>
            {errors.plan_duration_days && (
              <p className="text-destructive text-xs mt-1 font-bold">
                {errors.plan_duration_days.message}
              </p>
            )}
          </div>

          {/* Medical Conditions Section Divider */}
          <div className="border-t border-border pt-4 mt-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
              Medical Conditions
            </h3>
          </div>

          {/* Medical Conditions */}
          <div>
            {/* Selected Conditions Tags */}
            {selectedConditionIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedConditionIds.map((conditionId) => (
                  <span
                    key={conditionId}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary text-xs font-bold"
                  >
                    {getConditionName(conditionId)}
                    <button
                      type="button"
                      onClick={() => removeCondition(conditionId)}
                      disabled={isSubmitting}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {/* Conditions Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowConditionsDropdown(!showConditionsDropdown)}
                disabled={isSubmitting || conditionsLoading}
                className={cn(
                  "w-full p-3 bg-secondary border border-border text-left text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-ring",
                  "flex items-center justify-between"
                )}
              >
                <span className="text-muted-foreground">
                  {conditionsLoading
                    ? "Loading conditions..."
                    : selectedConditionIds.length > 0
                      ? `${selectedConditionIds.length} condition${selectedConditionIds.length > 1 ? "s" : ""} selected`
                      : "Add condition..."}
                </span>
                <svg
                  className={cn(
                    "h-4 w-4 transition-transform",
                    showConditionsDropdown && "rotate-180"
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {showConditionsDropdown && !conditionsLoading && (
                <div className="absolute z-10 w-full mt-1 bg-card border border-border shadow-lg max-h-48 overflow-y-auto">
                  {conditions.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">No conditions available</div>
                  ) : (
                    conditions
                      .filter((c) => c.slug !== "none")
                      .map((condition) => (
                        <label
                          key={condition.id}
                          className="flex items-center gap-2 p-3 hover:bg-secondary cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedConditionIds.includes(condition.id)}
                            onCheckedChange={() => toggleCondition(condition.id)}
                            disabled={isSubmitting}
                          />
                          <span className="text-sm">{condition.name}</span>
                          {condition.gender_restriction && (
                            <span className="text-xs text-muted-foreground">
                              ({condition.gender_restriction} only)
                            </span>
                          )}
                        </label>
                      ))
                  )}
                </div>
              )}
            </div>
            {errors.condition_ids && (
              <p className="text-destructive text-xs mt-1 font-bold">
                {errors.condition_ids.message}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-athletic flex-1 px-4 py-3 bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "btn-athletic flex-1 flex items-center justify-center gap-2 px-4 py-3 gradient-electric text-black glow-power",
                isSubmitting && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
