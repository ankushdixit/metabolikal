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
  Pencil,
  X,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/auth";
import type { Profile, ProfileGender } from "@/lib/database.types";

interface ProfileDetailsCardProps {
  profile: Profile | null;
  userEmail: string | null;
  onProfileUpdated?: () => void;
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

interface EditableRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "date" | "tel";
  placeholder?: string;
}

function EditableRow({
  icon,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: EditableRowProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-b-0">
      <div className="p-2 bg-secondary text-primary">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
          {label}
        </p>
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-9 text-sm"
        />
      </div>
    </div>
  );
}

interface GenderSelectRowProps {
  icon: React.ReactNode;
  label: string;
  value: ProfileGender | null;
  onChange: (value: ProfileGender) => void;
}

function GenderSelectRow({ icon, label, value, onChange }: GenderSelectRowProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-b-0">
      <div className="p-2 bg-secondary text-primary">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
          {label}
        </p>
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value as ProfileGender)}
          className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </select>
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
 * Displays personal information (editable), account details (read-only), and security section
 */
export function ProfileDetailsCard({
  profile,
  userEmail,
  onProfileUpdated,
}: ProfileDetailsCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editable form state
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [dateOfBirth, setDateOfBirth] = useState(profile?.date_of_birth || "");
  const [gender, setGender] = useState<ProfileGender | null>(profile?.gender || null);
  const [address, setAddress] = useState(profile?.address || "");

  // Password reset state
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleStartEditing = () => {
    // Reset form to current profile values
    setFullName(profile?.full_name || "");
    setPhone(profile?.phone || "");
    setDateOfBirth(profile?.date_of_birth || "");
    setGender(profile?.gender || null);
    setAddress(profile?.address || "");
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const supabase = createBrowserSupabaseClient();

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          date_of_birth: dateOfBirth || null,
          gender: gender,
          address: address.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) {
        throw new Error(error.message);
      }

      setSaveSuccess(true);
      setIsEditing(false);

      // Notify parent to refetch profile
      onProfileUpdated?.();

      // Clear success message after delay
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

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
        if (error.message.includes("invalid")) {
          throw new Error(
            "Unable to send reset email. Please ensure you're using a valid email address."
          );
        }
        throw new Error(error.message);
      }

      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 5000);
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 gradient-electric" />
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              Personal Information
            </h2>
          </div>

          {!isEditing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartEditing}
              className="text-xs uppercase tracking-wider"
            >
              <Pencil className="w-3 h-3 mr-1" />
              Edit
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEditing}
                disabled={isSaving}
                className="text-xs uppercase tracking-wider"
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !fullName.trim()}
                className="text-xs uppercase tracking-wider"
              >
                {isSaving ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Save className="w-3 h-3 mr-1" />
                )}
                Save
              </Button>
            </div>
          )}
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 px-3 py-2 rounded-sm mb-4">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        {/* Error Message */}
        {saveError && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-sm mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <div className="space-y-0">
          {isEditing ? (
            <>
              <EditableRow
                icon={<User className="w-4 h-4" />}
                label="Full Name"
                value={fullName}
                onChange={setFullName}
                placeholder="Enter your full name"
              />
              <EditableRow
                icon={<Phone className="w-4 h-4" />}
                label="Phone"
                value={phone}
                onChange={setPhone}
                type="tel"
                placeholder="Enter your phone number"
              />
              <EditableRow
                icon={<Calendar className="w-4 h-4" />}
                label="Date of Birth"
                value={dateOfBirth}
                onChange={setDateOfBirth}
                type="date"
              />
              <GenderSelectRow
                icon={<User className="w-4 h-4" />}
                label="Gender"
                value={gender}
                onChange={setGender}
              />
              <EditableRow
                icon={<MapPin className="w-4 h-4" />}
                label="Address"
                value={address}
                onChange={setAddress}
                placeholder="Enter your address"
              />
            </>
          ) : (
            <>
              <DetailRow
                icon={<User className="w-4 h-4" />}
                label="Full Name"
                value={profile?.full_name}
              />
              <DetailRow
                icon={<Phone className="w-4 h-4" />}
                label="Phone"
                value={profile?.phone}
              />
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
            </>
          )}
        </div>
      </div>

      {/* Account Details Section (Read-only) */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-1 gradient-electric" />
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
            Account Details
          </h2>
        </div>

        <div className="space-y-0">
          <DetailRow
            icon={<Mail className="w-4 h-4" />}
            label="Email"
            value={userEmail || profile?.email}
          />
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
