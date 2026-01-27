"use client";

import { useState } from "react";
import { HeartPulse, Info, ChevronDown, ChevronUp } from "lucide-react";
import type { ClientConditionWithDetails } from "@/hooks/use-client-profile-data";

interface ProfileConditionsCardProps {
  conditions: ClientConditionWithDetails[];
  isLoading?: boolean;
}

interface ConditionItemProps {
  condition: ClientConditionWithDetails;
}

function ConditionItem({ condition }: ConditionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const medicalCondition = condition.medical_conditions;

  if (!medicalCondition) return null;

  const hasDescription = !!medicalCondition.description;

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => hasDescription && setIsExpanded(!isExpanded)}
        disabled={!hasDescription}
        className={`w-full flex items-center gap-3 py-3 text-left ${hasDescription ? "cursor-pointer hover:bg-secondary/50" : "cursor-default"}`}
      >
        <div className="w-2 h-2 rounded-full gradient-electric flex-shrink-0" />
        <span className="flex-1 text-sm font-medium">{medicalCondition.name}</span>
        {hasDescription && (
          <span className="text-muted-foreground">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        )}
      </button>
      {isExpanded && hasDescription && (
        <div className="pl-5 pb-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {medicalCondition.description}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Profile Conditions Card Component
 * Displays the client's medical conditions with expandable descriptions
 */
export function ProfileConditionsCard({ conditions, isLoading }: ProfileConditionsCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="athletic-card p-6 pl-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-1 gradient-electric" />
          <h2 className="text-sm font-black uppercase tracking-wider">Health Conditions</h2>
        </div>
        <div className="space-y-3 animate-pulse">
          <div className="h-8 bg-secondary rounded" />
          <div className="h-8 bg-secondary rounded" />
        </div>
      </div>
    );
  }

  const validConditions = conditions.filter((c) => c.medical_conditions !== null);

  return (
    <div className="athletic-card p-6 pl-8">
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center gap-2 mb-4 text-left"
      >
        <div className="w-6 h-1 gradient-electric" />
        <h2 className="text-sm font-black uppercase tracking-wider flex-1">Health Conditions</h2>
        <span className="text-muted-foreground md:hidden">
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </span>
      </button>

      <div className={`${isCollapsed ? "hidden md:block" : ""}`}>
        {validConditions.length === 0 ? (
          <div className="py-4 text-center">
            <HeartPulse className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No conditions on file</p>
          </div>
        ) : (
          <div className="space-y-0">
            {validConditions.map((condition) => (
              <ConditionItem key={condition.id} condition={condition} />
            ))}
          </div>
        )}

        {/* Footer Note */}
        <div className="flex items-start gap-2 mt-4 pt-4 border-t border-border">
          <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">Conditions are managed by your coach</p>
        </div>
      </div>
    </div>
  );
}
