"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Scale, Ruler } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CheckIn } from "@/lib/database.types";

interface ProgressChartsProps {
  checkIns: CheckIn[];
}

type DateRange = "30days" | "90days" | "all";

/**
 * Progress charts component
 * Displays weight and measurement trends over time
 */
export function ProgressCharts({ checkIns }: ProgressChartsProps) {
  const [dateRange, setDateRange] = useState<DateRange>("all");

  // Filter check-ins by date range
  const filteredCheckIns = useMemo(() => {
    if (dateRange === "all") return checkIns;

    const now = new Date();
    const daysAgo = dateRange === "30days" ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    return checkIns.filter((c) => new Date(c.submitted_at) >= cutoffDate);
  }, [checkIns, dateRange]);

  // Prepare weight chart data (sorted by date ascending)
  const weightData = useMemo(() => {
    return [...filteredCheckIns]
      .sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime())
      .map((c) => ({
        date: new Date(c.submitted_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        weight: c.weight,
      }));
  }, [filteredCheckIns]);

  // Prepare measurements chart data
  const measurementsData = useMemo(() => {
    return [...filteredCheckIns]
      .sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime())
      .map((c) => ({
        date: new Date(c.submitted_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        chest: c.chest_cm,
        waist: c.waist_cm,
        arms: c.arms_cm,
        thighs: c.thighs_cm,
      }));
  }, [filteredCheckIns]);

  // Check if there's measurement data
  const hasMeasurements = measurementsData.some((d) => d.chest || d.waist || d.arms || d.thighs);

  const dateRanges: { label: string; value: DateRange }[] = [
    { label: "Last 30 Days", value: "30days" },
    { label: "Last 90 Days", value: "90days" },
    { label: "All Time", value: "all" },
  ];

  if (checkIns.length === 0) {
    return (
      <div className="athletic-card p-8 pl-10 text-center">
        <p className="text-muted-foreground font-bold">No check-in data available for charts</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="athletic-card p-4 pl-8">
        <div className="flex flex-wrap gap-2">
          {dateRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setDateRange(range.value)}
              className={cn(
                "btn-athletic px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all",
                dateRange === range.value
                  ? "gradient-electric text-black"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Weight Chart */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex items-center gap-2 mb-6">
          <Scale className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-black uppercase tracking-tight">
            Weight <span className="gradient-athletic">Trend</span>
          </h2>
        </div>
        {weightData.length < 2 ? (
          <p className="text-muted-foreground font-bold">
            Need at least 2 check-ins to show weight trend
          </p>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(0 0% 50%)"
                  tick={{ fill: "hsl(0 0% 50%)", fontSize: 12 }}
                />
                <YAxis
                  stroke="hsl(0 0% 50%)"
                  tick={{ fill: "hsl(0 0% 50%)", fontSize: 12 }}
                  domain={["dataMin - 2", "dataMax + 2"]}
                  tickFormatter={(value) => `${value}kg`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0 0% 7%)",
                    border: "1px solid hsl(0 0% 15%)",
                    borderRadius: "0",
                  }}
                  labelStyle={{ color: "hsl(0 0% 100%)", fontWeight: "bold" }}
                  formatter={(value: number) => [`${value}kg`, "Weight"]}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="hsl(12 78% 57%)"
                  strokeWidth={3}
                  dot={{ fill: "hsl(12 78% 57%)", strokeWidth: 0, r: 5 }}
                  activeDot={{ r: 7, fill: "hsl(45 100% 50%)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Measurements Chart */}
      {hasMeasurements && (
        <div className="athletic-card p-6 pl-8">
          <div className="flex items-center gap-2 mb-6">
            <Ruler className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-black uppercase tracking-tight">
              Measurements <span className="gradient-athletic">Trend</span>
            </h2>
          </div>
          {measurementsData.length < 2 ? (
            <p className="text-muted-foreground font-bold">
              Need at least 2 check-ins to show measurement trends
            </p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={measurementsData}
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(0 0% 50%)"
                    tick={{ fill: "hsl(0 0% 50%)", fontSize: 12 }}
                  />
                  <YAxis
                    stroke="hsl(0 0% 50%)"
                    tick={{ fill: "hsl(0 0% 50%)", fontSize: 12 }}
                    tickFormatter={(value) => `${value}cm`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0 0% 7%)",
                      border: "1px solid hsl(0 0% 15%)",
                      borderRadius: "0",
                    }}
                    labelStyle={{ color: "hsl(0 0% 100%)", fontWeight: "bold" }}
                    formatter={(value: number, name: string) => [
                      `${value}cm`,
                      name.charAt(0).toUpperCase() + name.slice(1),
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "20px" }}
                    formatter={(value) => (
                      <span style={{ color: "hsl(0 0% 70%)", fontWeight: "bold" }}>
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                      </span>
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="chest"
                    stroke="hsl(12 78% 57%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(12 78% 57%)", strokeWidth: 0, r: 4 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="waist"
                    stroke="hsl(45 100% 50%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(45 100% 50%)", strokeWidth: 0, r: 4 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="arms"
                    stroke="hsl(120 100% 40%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(120 100% 40%)", strokeWidth: 0, r: 4 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="thighs"
                    stroke="hsl(200 100% 50%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(200 100% 50%)", strokeWidth: 0, r: 4 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
