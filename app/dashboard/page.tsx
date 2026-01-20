"use client";

import { useState, useEffect } from "react";
import { useList, useOne } from "@refinedev/core";
import { Calendar, Flame } from "lucide-react";
import { CalorieSummary, ProteinProgress, QuickActions } from "@/components/dashboard";
import { createBrowserSupabaseClient } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Profile {
  full_name?: string;
  created_at?: string;
}

interface FoodLog {
  calories?: number;
  protein?: number;
}

interface DietPlan {
  target_calories?: number;
  target_protein?: number;
  food_items?: { calories: number; protein: number }[];
}

/**
 * Dashboard Home Page
 * Displays daily overview metrics and quick actions
 * Athletic-styled to match landing page design
 */
export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLogFoodOpen, setIsLogFoodOpen] = useState(false);

  // Get current user ID from Supabase auth
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      }
    });
  }, []);

  // Fetch user profile for welcome message and program start date
  const profileQuery = useOne<Profile>({
    resource: "profiles",
    id: userId || "",
    queryOptions: {
      enabled: !!userId,
    },
  });

  // Calculate date values
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  // Calculate day number from profile creation date
  const profile = profileQuery.query.data?.data as Profile | undefined;
  const programStartDate = profile?.created_at ? new Date(profile.created_at) : today;
  const dayNumber =
    Math.floor((today.getTime() - programStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Fetch today's food logs for calorie/protein totals
  const foodLogsQuery = useList<FoodLog>({
    resource: "food_logs",
    filters: [
      { field: "client_id", operator: "eq", value: userId },
      { field: "logged_at", operator: "gte", value: startOfToday.toISOString() },
      { field: "logged_at", operator: "lt", value: startOfTomorrow.toISOString() },
    ],
    queryOptions: {
      enabled: !!userId,
    },
  });

  // Fetch diet plan for current day to get targets
  const dietPlanQuery = useList<DietPlan>({
    resource: "diet_plans",
    filters: [
      { field: "client_id", operator: "eq", value: userId },
      { field: "day_number", operator: "eq", value: dayNumber },
    ],
    meta: {
      select: "*, food_items(calories, protein)",
    },
    queryOptions: {
      enabled: !!userId,
    },
  });

  // Calculate consumed calories and protein from food logs
  const foodLogs = foodLogsQuery.query.data?.data || [];
  const consumedCalories = foodLogs.reduce(
    (sum: number, log: FoodLog) => sum + (log.calories || 0),
    0
  );
  const consumedProtein = foodLogs.reduce(
    (sum: number, log: FoodLog) => sum + (log.protein || 0),
    0
  );

  // Calculate target calories and protein from diet plan
  const dietPlan = dietPlanQuery.query.data?.data?.[0] as DietPlan | undefined;

  // Use diet plan targets or calculate from food items, or use defaults
  const targetCalories =
    dietPlan?.target_calories ||
    dietPlan?.food_items?.reduce((sum: number, item) => sum + item.calories, 0) ||
    2000;
  const targetProtein =
    dietPlan?.target_protein ||
    dietPlan?.food_items?.reduce((sum: number, item) => sum + item.protein, 0) ||
    150;

  // Format date
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Get first name for welcome message
  const fullName = profile?.full_name || "Champion";
  const firstName = fullName.split(" ")[0];

  const isLoading =
    profileQuery.query.isLoading || foodLogsQuery.query.isLoading || dietPlanQuery.query.isLoading;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome Section */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              Welcome back, <span className="gradient-athletic">{firstName}</span>
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
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calorie Summary */}
        {isLoading ? (
          <div className="athletic-card p-6 pl-8 animate-pulse">
            <div className="h-4 w-24 bg-secondary mb-4" />
            <div className="h-8 w-32 bg-secondary mb-4" />
            <div className="h-3 w-full bg-secondary" />
          </div>
        ) : (
          <CalorieSummary consumed={consumedCalories} target={targetCalories} />
        )}

        {/* Protein Progress */}
        {isLoading ? (
          <div className="athletic-card p-6 pl-8 animate-pulse">
            <div className="h-4 w-24 bg-secondary mb-4" />
            <div className="h-8 w-32 bg-secondary mb-4" />
            <div className="h-3 w-full bg-secondary" />
          </div>
        ) : (
          <ProteinProgress consumed={consumedProtein} target={targetProtein} />
        )}
      </div>

      {/* Quick Actions */}
      <QuickActions onLogFood={() => setIsLogFoodOpen(true)} />

      {/* Log Food Modal */}
      <Dialog open={isLogFoodOpen} onOpenChange={setIsLogFoodOpen}>
        <DialogContent className="max-w-md bg-card p-0">
          <DialogHeader className="p-6 pb-4 border-b border-border">
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              Log <span className="gradient-athletic">Food</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-bold text-sm">
              Add food to your daily intake
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <p className="text-sm text-muted-foreground font-bold mb-4">
              Food logging functionality will be available soon.
            </p>
            <button
              onClick={() => setIsLogFoodOpen(false)}
              className="btn-athletic w-full px-5 py-3 bg-secondary text-foreground"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
