"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClientSchema, type CreateClientFormData } from "@/lib/validations";
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

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

/**
 * Modal for creating a new client account
 * Sends an invite email for the client to set up their password
 */
export function AddClientModal({ isOpen, onClose, onSuccess }: AddClientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateClientFormData>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      full_name: "",
      email: "",
      date_of_birth: "",
      gender: undefined,
      address: "",
    },
  });

  const selectedGender = watch("gender");

  const handleFormSubmit = async (data: CreateClientFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await fetch("/api/admin/invite-client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.details) {
          // Handle validation errors from server
          const errorMessages = result.details
            .map((d: { field: string; message: string }) => d.message)
            .join(", ");
          setServerError(errorMessages);
        } else {
          setServerError(result.error || "Failed to create client");
        }
        return;
      }

      // Success - show toast and close modal
      toast.success(result.message || "Client created successfully!");
      reset();
      onClose();
      onSuccess?.();
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      reset();
      setServerError(null);
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
            Add <span className="gradient-athletic">Client</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm">
            Create a new client account. They will receive an email to set up their password.
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
              value={selectedGender || ""}
              onValueChange={(value) => setValue("gender", value as CreateClientFormData["gender"])}
              disabled={isSubmitting}
            >
              <SelectTrigger
                id="gender"
                className={cn("bg-secondary border-border", errors.gender && "border-destructive")}
              >
                <SelectValue placeholder="Select gender (optional)" />
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

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
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
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Add Client</span>
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
