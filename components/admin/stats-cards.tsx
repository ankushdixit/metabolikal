"use client";

import { Users, ClipboardCheck, Flag } from "lucide-react";

interface StatsCardsProps {
  totalClients: number;
  pendingReviews: number;
  flaggedClients: number;
  isLoading?: boolean;
}

/**
 * Stats cards for the admin dashboard
 * Displays key metrics in athletic-styled cards
 */
export function StatsCards({
  totalClients,
  pendingReviews,
  flaggedClients,
  isLoading = false,
}: StatsCardsProps) {
  const stats = [
    {
      label: "Total Clients",
      value: totalClients,
      icon: Users,
      description: "Active clients in the program",
    },
    {
      label: "Pending Reviews",
      value: pendingReviews,
      icon: ClipboardCheck,
      description: "Check-ins awaiting review",
      highlight: pendingReviews > 0,
    },
    {
      label: "Flagged Clients",
      value: flaggedClients,
      icon: Flag,
      description: "Clients needing follow-up",
      highlight: flaggedClients > 0,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="athletic-card p-6 pl-8 animate-pulse">
            <div className="flex items-start justify-between">
              <div>
                <div className="h-3 w-24 bg-secondary mb-3" />
                <div className="h-10 w-16 bg-secondary mb-2" />
                <div className="h-3 w-32 bg-secondary" />
              </div>
              <div className="h-12 w-12 bg-secondary" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="athletic-card p-6 pl-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground mb-1">
                {stat.label}
              </p>
              <p
                className={`text-4xl font-black ${
                  stat.highlight ? "gradient-athletic" : "text-foreground"
                }`}
              >
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground font-bold mt-2">{stat.description}</p>
            </div>
            <div className={`p-3 ${stat.highlight ? "bg-primary/20" : "bg-secondary"}`}>
              <stat.icon
                className={`h-6 w-6 ${stat.highlight ? "text-primary" : "text-muted-foreground"}`}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
