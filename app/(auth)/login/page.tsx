"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginFormData, createBrowserSupabaseClient } from "@/lib/auth";
import { migrateLocalStorageToDatabase } from "@/hooks/use-assessment-storage";

/**
 * Login Page
 * Allows users to sign in with email and password.
 * Redirects based on user role: clients to /dashboard, admins to /admin.
 */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createBrowserSupabaseClient();

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      // Migrate any localStorage assessment data to database
      // This runs in background - don't block login on migration
      migrateLocalStorageToDatabase(authData.user.id).catch((err) => {
        console.error("Failed to migrate localStorage data:", err);
      });

      // Get user role for redirect
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      const role = profile?.role ?? "client";
      const redirectTo = role === "admin" ? "/admin" : "/dashboard";

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground">Sign in to your account to continue</p>
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

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={isLoading}
            {...register("password")}
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="space-y-2 text-center text-sm">
        <Link href="/forgot-password" className="text-primary hover:underline underline-offset-4">
          Forgot password?
        </Link>
        <p className="text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary hover:underline underline-offset-4">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
