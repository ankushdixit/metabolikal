"use client";

import { useState, useEffect } from "react";
import { useOne } from "@refinedev/core";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { ProfilePhotoUpload } from "@/components/dashboard/profile-photo-upload";
import { ProfileDetailsCard } from "@/components/dashboard/profile-details-card";
import type { Profile } from "@/lib/database.types";

/**
 * Client Profile Page
 * Displays user profile details, photo upload, and security options
 */
export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Get current user from Supabase auth
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        setUserEmail(data.user.email || null);
      }
    });
  }, []);

  // Fetch user profile
  const profileQuery = useOne<Profile>({
    resource: "profiles",
    id: userId || "",
    queryOptions: {
      enabled: !!userId,
    },
  });

  const profile = profileQuery.query.data?.data;
  const isLoading = profileQuery.query.isLoading;

  // Wrap refetch to ensure it's always callable
  const handlePhotoUpdated = () => {
    profileQuery.query.refetch();
  };

  if (isLoading || !userId) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="athletic-card p-6 pl-8">
          <div className="h-8 w-48 bg-secondary animate-pulse" />
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Photo Section Skeleton */}
          <div className="athletic-card p-6 pl-8 flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-full bg-secondary animate-pulse" />
            <div className="h-10 w-full bg-secondary animate-pulse" />
          </div>

          {/* Details Section Skeleton */}
          <div className="lg:col-span-2 athletic-card p-6 pl-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-6 bg-secondary animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-1 gradient-electric" />
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
            My <span className="gradient-athletic">Profile</span>
          </h1>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Photo Section */}
        <ProfilePhotoUpload
          userId={userId}
          currentAvatarUrl={profile?.avatar_url || null}
          onPhotoUpdated={handlePhotoUpdated}
        />

        {/* Details Section */}
        <div className="lg:col-span-2">
          <ProfileDetailsCard
            profile={profile || null}
            userEmail={userEmail}
            onProfileUpdated={handlePhotoUpdated}
          />
        </div>
      </div>
    </div>
  );
}
