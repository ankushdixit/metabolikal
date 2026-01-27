"use client";

import { Calendar, Clock, Target, Flag } from "lucide-react";
import { type PlanInfo, formatPlanDate } from "@/hooks/use-client-profile-data";

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-b-0">
      <div className="p-2 bg-secondary text-primary">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

interface ProfilePlanCardProps {
  planInfo: PlanInfo;
  isLoading?: boolean;
}

/**
 * Profile Plan Card Component
 * Displays plan start date, duration, progress, and end date
 */
export function ProfilePlanCard({ planInfo, isLoading }: ProfilePlanCardProps) {
  if (isLoading) {
    return (
      <div className="athletic-card p-6 pl-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-1 gradient-electric" />
          <h2 className="text-sm font-black uppercase tracking-wider">My Plan</h2>
        </div>
        <div className="space-y-3 animate-pulse">
          <div className="h-12 bg-secondary rounded" />
          <div className="h-12 bg-secondary rounded" />
          <div className="h-12 bg-secondary rounded" />
        </div>
      </div>
    );
  }

  if (!planInfo.isConfigured) {
    return (
      <div className="athletic-card p-6 pl-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-1 gradient-electric" />
          <h2 className="text-sm font-black uppercase tracking-wider">My Plan</h2>
        </div>
        <div className="py-4 text-center">
          <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Your plan has not been configured yet.</p>
          <p className="text-muted-foreground text-xs mt-1">Your coach will set this up for you.</p>
        </div>
      </div>
    );
  }

  const {
    startDate,
    endDate,
    durationDays,
    dayNumber,
    daysRemaining,
    progressPercent,
    isBeforeStart,
    isCompleted,
  } = planInfo;

  return (
    <div className="athletic-card p-6 pl-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-1 gradient-electric" />
        <h2 className="text-sm font-black uppercase tracking-wider">My Plan</h2>
        {isCompleted && (
          <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-primary/20 text-primary">
            COMPLETED
          </span>
        )}
        {isBeforeStart && (
          <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-500">
            STARTING SOON
          </span>
        )}
      </div>

      <div className="space-y-0">
        <DetailRow
          icon={<Calendar className="w-4 h-4" />}
          label="Started"
          value={formatPlanDate(startDate!)}
        />
        <DetailRow
          icon={<Clock className="w-4 h-4" />}
          label="Duration"
          value={`${durationDays} days`}
        />

        {/* Progress Section */}
        <div className="py-3 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-secondary text-primary">
              <Flag className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Progress
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold">
                    {isBeforeStart
                      ? `Starts in ${Math.abs(dayNumber! - 1)} days`
                      : isCompleted
                        ? `Day ${durationDays} of ${durationDays}`
                        : `Day ${dayNumber} of ${durationDays}`}
                  </span>
                  <span className="text-muted-foreground">{progressPercent}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-electric transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DetailRow
          icon={<Target className="w-4 h-4" />}
          label="Ends"
          value={
            isCompleted
              ? `Completed on ${formatPlanDate(endDate!)}`
              : `${formatPlanDate(endDate!)} (${daysRemaining} days remaining)`
          }
        />
      </div>
    </div>
  );
}
