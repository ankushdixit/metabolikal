"use client";

import { useState, useCallback } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Shield,
  Lock,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/auth";
import type { Profile, ProfileGender } from "@/lib/database.types";

interface ProfileDetailsCardProps {
  profile: Profile | null;
  userEmail: string | null;
}

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  placeholder?: string;
}

function DetailRow({ icon, label, value, placeholder = "Not provided" }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-b-0">
      <div className="p-2 bg-secondary text-primary">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
          {label}
        </p>
        <p
          className={`text-sm font-medium ${value ? "text-foreground" : "text-muted-foreground italic"}`}
        >
          {value || placeholder}
        </p>
      </div>
    </div>
  );
}

/**
 * Format date of birth nicely
 */
function formatDateOfBirth(dateString: string | null | undefined): string | null {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * Format created_at date
 */
function formatMemberSince(dateString: string | null | undefined): string {
  if (!dateString) return "Unknown";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Unknown";
  }
}

/**
 * Format gender for display
 */
function formatGender(gender: ProfileGender | null | undefined): string | null {
  if (!gender) return null;

  const genderMap: Record<ProfileGender, string> = {
    male: "Male",
    female: "Female",
    other: "Other",
    prefer_not_to_say: "Prefer not to say",
  };

  return genderMap[gender] || null;
}

/**
 * Format role for display
 */
function formatRole(role: string | undefined): string {
  if (!role) return "Client";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

/**
 * Profile Details Card Component
 * Displays personal information, account details, and security section
 */
export function ProfileDetailsCard({ profile, userEmail }: ProfileDetailsCardProps) {
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleResetPassword = useCallback(async () => {
    const email = userEmail || profile?.email;
    if (!email) {
      setResetError("Email not found. Please contact support.");
      return;
    }

    setIsResettingPassword(true);
    setResetError(null);
    setResetSuccess(false);

    try {
      const supabase = createBrowserSupabaseClient();

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        // Provide more helpful error messages
        if (error.message.includes("invalid")) {
          throw new Error(
            "Unable to send reset email. Please ensure you're using a valid email address."
          );
        }
        throw new Error(error.message);
      }

      setResetSuccess(true);

      // Reset success message after a delay
      setTimeout(() => {
        setResetSuccess(false);
      }, 5000);
    } catch (error) {
      setResetError(error instanceof Error ? error.message : "Failed to send reset email.");
    } finally {
      setIsResettingPassword(false);
    }
  }, [userEmail, profile?.email]);

  return (
    <div className="athletic-card p-6 pl-8 space-y-6">
      {/* Personal Information Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-1 gradient-electric" />
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
            Personal Information
          </h2>
        </div>

        <div className="space-y-0">
          <DetailRow
            icon={<User className="w-4 h-4" />}
            label="Full Name"
            value={profile?.full_name}
          />
          <DetailRow
            icon={<Mail className="w-4 h-4" />}
            label="Email"
            value={userEmail || profile?.email}
          />
          <DetailRow icon={<Phone className="w-4 h-4" />} label="Phone" value={profile?.phone} />
          <DetailRow
            icon={<Calendar className="w-4 h-4" />}
            label="Date of Birth"
            value={formatDateOfBirth(profile?.date_of_birth)}
          />
          <DetailRow
            icon={<User className="w-4 h-4" />}
            label="Gender"
            value={formatGender(profile?.gender)}
          />
          <DetailRow
            icon={<MapPin className="w-4 h-4" />}
            label="Address"
            value={profile?.address}
          />
        </div>
      </div>

      {/* Account Details Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-1 gradient-electric" />
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
            Account Details
          </h2>
        </div>

        <div className="space-y-0">
          <DetailRow
            icon={<Calendar className="w-4 h-4" />}
            label="Member Since"
            value={formatMemberSince(profile?.created_at)}
          />
          <DetailRow
            icon={<Shield className="w-4 h-4" />}
            label="Role"
            value={formatRole(profile?.role)}
          />
        </div>
      </div>

      {/* Security Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-1 gradient-electric" />
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Security</h2>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            To change your password, click the button below and we&apos;ll send a reset link to your
            email.
          </p>

          {/* Success Message */}
          {resetSuccess && (
            <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 px-3 py-2 rounded-sm">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>Password reset email sent! Check your inbox.</span>
            </div>
          )}

          {/* Error Message */}
          {resetError && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{resetError}</span>
            </div>
          )}

          <Button
            variant="outline"
            onClick={handleResetPassword}
            disabled={isResettingPassword}
            className="w-full sm:w-auto"
          >
            {isResettingPassword ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
