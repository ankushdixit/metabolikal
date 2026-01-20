"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
  createBrowserSupabaseClient,
} from "@/lib/auth";

/**
 * Forgot Password Page
 * Allows users to request a password reset email.
 */
export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createBrowserSupabaseClient();

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="text-muted-foreground">Check your email for reset instructions</p>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-sm p-4 text-sm text-center">
          <p className="text-primary">
            We&apos;ve sent you an email with a link to reset your password. Please check your
            inbox.
          </p>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline underline-offset-4">
            Back to login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Forgot password?</h1>
        <p className="text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-sm p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isLoading}
            {...register("email")}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send Reset Link"}
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
