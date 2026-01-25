"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
  createBrowserSupabaseClient,
} from "@/lib/auth";

/**
 * Reset Password Page
 * Allows users to set a new password after clicking the reset link.
 * This page is accessed via the email link from the password reset flow.
 * Also used for invited users to set their initial password.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if this is a new invited user
  const isInvitedUser = message?.includes("Welcome");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(data: ResetPasswordFormData) {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createBrowserSupabaseClient();

      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }

      // Sign out after password reset to ensure clean session
      await supabase.auth.signOut();

      // Redirect to login with success message
      const successMessage = isInvitedUser
        ? "Account setup complete! Please sign in."
        : "Password reset successful";
      router.push(`/login?message=${encodeURIComponent(successMessage)}`);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {isInvitedUser ? "Set your password" : "Reset password"}
        </h1>
        <p className="text-muted-foreground">
          {isInvitedUser
            ? "Create a password to complete your account setup"
            : "Enter your new password below"}
        </p>
      </div>

      {message && (
        <div className="bg-primary/10 border border-primary/20 rounded-sm p-3 text-sm text-primary">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-sm p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            disabled={isLoading}
            {...register("password")}
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your new password"
            autoComplete="new-password"
            disabled={isLoading}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading
            ? isInvitedUser
              ? "Setting up..."
              : "Resetting..."
            : isInvitedUser
              ? "Set Password"
              : "Reset Password"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline underline-offset-4">
          Back to login
        </Link>
      </p>
    </div>
  );
}
