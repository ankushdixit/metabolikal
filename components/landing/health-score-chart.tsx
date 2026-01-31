"use client";

import { useState, useEffect } from "react";

interface HealthScoreChartProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  animated?: boolean;
}

/**
 * Get tier color based on health score
 * Color tiers match the shareable-results-image.tsx logic
 */
function getTierColor(score: number): string {
  if (score >= 86) return "#22c55e"; // Elite - green
  if (score >= 71) return "#eab308"; // Good - yellow
  if (score >= 51) return "#f97316"; // Moderate - orange
  return "#ef4444"; // Needs Attention - red
}

/**
 * Animated circular progress chart for health score display.
 * Uses SVG with stroke-dasharray/dashoffset for the ring effect.
 * Animates from 0 to target score on mount when animated=true.
 */
export function HealthScoreChart({
  score,
  size = 200,
  strokeWidth = 12,
  animated = true,
}: HealthScoreChartProps) {
  const [animatedScore, setAnimatedScore] = useState(animated ? 0 : score);

  // Animate score from 0 to target on mount
  useEffect(() => {
    if (!animated) {
      setAnimatedScore(score);
      return;
    }

    // Start animation after a brief delay for visual effect
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);

    return () => clearTimeout(timer);
  }, [score, animated]);

  // Calculate SVG dimensions - use same approach as shareable-results-image.tsx
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;
  const tierColor = getTierColor(score);

  return (
    <div
      className="relative"
      style={{ width: size, height: size, overflow: "visible" }}
      role="img"
      aria-label={`Health score: ${score} out of 100`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)", overflow: "visible" }}
      >
        {/* Background circle - use solid color like shareable-results-image.tsx */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#27272a"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tierColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: animated ? "stroke-dashoffset 1s ease-out" : "none",
            filter: `drop-shadow(0 0 4px ${tierColor}50)`,
          }}
        />
      </svg>

      {/* Center content - positioned absolutely with inline styles only */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: size * 0.32,
            fontWeight: 900,
            lineHeight: 1,
            background: "linear-gradient(135deg, #ea580c 0%, #facc15 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {score}
        </div>
        <div
          style={{
            fontSize: size * 0.09,
            color: "#a1a1aa",
            fontWeight: 700,
            marginTop: 2,
          }}
        >
          /100
        </div>
      </div>
    </div>
  );
}
