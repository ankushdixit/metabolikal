"use client";

import { forwardRef } from "react";
import Image from "next/image";

interface ShareableResultsImageProps {
  healthScore: number;
  healthTierName: string;
  lifestyleScore: number;
  physicalScore: number;
  bmr: number;
  tdee: number;
  lifestyleBoostPercentage: number;
}

/**
 * Shareable results image component
 * Renders a static, branded image for social media sharing
 * Uses inline styles for html-to-image compatibility
 */
export const ShareableResultsImage = forwardRef<HTMLDivElement, ShareableResultsImageProps>(
  function ShareableResultsImage(
    {
      healthScore,
      healthTierName,
      lifestyleScore,
      physicalScore,
      bmr,
      tdee,
      lifestyleBoostPercentage,
    },
    ref
  ) {
    // Calculate the circular progress for health score
    const circumference = 2 * Math.PI * 90; // radius = 90
    const strokeDashoffset = circumference - (healthScore / 100) * circumference;

    // Get tier color based on score
    const getTierColor = (score: number) => {
      if (score >= 86) return "#22c55e"; // Elite - green
      if (score >= 71) return "#eab308"; // Good - yellow
      if (score >= 51) return "#f97316"; // Moderate - orange
      return "#ef4444"; // Needs Attention - red
    };

    const tierColor = getTierColor(healthScore);

    return (
      <div
        ref={ref}
        style={{
          width: "720px",
          minHeight: "1280px",
          background: "linear-gradient(180deg, #0a0a0a 0%, #1a0a0a 50%, #0a0a0a 100%)",
          padding: "48px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Logo Section */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              margin: "0 auto 16px",
              borderRadius: "50%",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <Image
              src="/images/logo.png"
              alt="METABOLIKAL"
              width={80}
              height={80}
              style={{ objectFit: "cover" }}
            />
          </div>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: 900,
              letterSpacing: "0.05em",
              margin: 0,
              background: "linear-gradient(135deg, #ea580c 0%, #facc15 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            METABOLIKAL
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#a1a1aa",
              margin: "8px 0 0 0",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Elite Performance
          </p>
        </div>

        {/* Health Score Section */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2
            style={{
              fontSize: "14px",
              fontWeight: 900,
              letterSpacing: "0.15em",
              color: "#ea580c",
              textTransform: "uppercase",
              marginBottom: "24px",
            }}
          >
            METABOLI-K-AL Health Score
          </h2>

          {/* Circular Progress */}
          <div style={{ position: "relative", width: "200px", height: "200px", margin: "0 auto" }}>
            <svg
              width="200"
              height="200"
              viewBox="0 0 200 200"
              style={{ transform: "rotate(-90deg)" }}
            >
              {/* Background circle */}
              <circle cx="100" cy="100" r="90" fill="none" stroke="#27272a" strokeWidth="12" />
              {/* Progress circle */}
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke={tierColor}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{
                  filter: `drop-shadow(0 0 10px ${tierColor}80)`,
                }}
              />
            </svg>
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
                  fontSize: "64px",
                  fontWeight: 900,
                  lineHeight: 1,
                  background: "linear-gradient(135deg, #ea580c 0%, #facc15 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {healthScore}
              </div>
              <div style={{ fontSize: "16px", color: "#a1a1aa", fontWeight: 700 }}>/100</div>
            </div>
          </div>

          {/* Tier Name */}
          <div
            style={{
              marginTop: "16px",
              fontSize: "18px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: tierColor,
            }}
          >
            {healthTierName}
          </div>
        </div>

        {/* Score Breakdown Section */}
        <div style={{ width: "100%", marginBottom: "48px" }}>
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 900,
              letterSpacing: "0.15em",
              color: "#ffffff",
              textTransform: "uppercase",
              marginBottom: "24px",
              textAlign: "center",
            }}
          >
            Score Breakdown
          </h3>

          {/* Lifestyle Score Bar */}
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#e4e4e7" }}>
                Lifestyle Assessment
              </span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#ea580c" }}>
                {lifestyleScore}%
              </span>
            </div>
            <div
              style={{
                height: "12px",
                background: "#27272a",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${lifestyleScore}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)",
                  borderRadius: "6px",
                }}
              />
            </div>
          </div>

          {/* Physical Score Bar */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#e4e4e7" }}>
                Physical Factors
              </span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#ea580c" }}>
                {physicalScore}%
              </span>
            </div>
            <div
              style={{
                height: "12px",
                background: "#27272a",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${physicalScore}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)",
                  borderRadius: "6px",
                }}
              />
            </div>
          </div>
        </div>

        {/* Metabolic Numbers Section */}
        <div style={{ width: "100%", marginBottom: "48px", textAlign: "center" }}>
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 900,
              letterSpacing: "0.15em",
              color: "#ffffff",
              textTransform: "uppercase",
              marginBottom: "24px",
            }}
          >
            Your Metabolic Numbers
          </h3>

          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <span style={{ fontSize: "20px" }}>🔥</span>
              <span style={{ fontSize: "14px", color: "#a1a1aa", fontWeight: 600 }}>
                Basal Metabolism (BMR)
              </span>
            </div>
            <div style={{ fontSize: "36px", fontWeight: 900 }}>{bmr.toLocaleString()} cal/day</div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <span style={{ fontSize: "20px" }}>⚡</span>
              <span style={{ fontSize: "14px", color: "#a1a1aa", fontWeight: 600 }}>
                Lifestyle-Adjusted TDEE
              </span>
            </div>
            <div
              style={{
                fontSize: "36px",
                fontWeight: 900,
                background: "linear-gradient(135deg, #ea580c 0%, #facc15 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {tdee.toLocaleString()} cal/day
            </div>
          </div>

          {/* Lifestyle Boost Badge */}
          {lifestyleBoostPercentage > 0 && (
            <div
              style={{
                display: "inline-block",
                padding: "12px 24px",
                border: "2px solid #22c55e",
                borderRadius: "8px",
                background: "rgba(34, 197, 94, 0.1)",
              }}
            >
              <span style={{ color: "#22c55e", fontWeight: 700, fontSize: "14px" }}>
                Your lifestyle is boosting your metabolism by {lifestyleBoostPercentage}%
              </span>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div style={{ marginTop: "auto", textAlign: "center", paddingTop: "48px" }}>
          <div
            style={{
              width: "200px",
              height: "2px",
              background: "linear-gradient(90deg, transparent, #ea580c, transparent)",
              margin: "0 auto 24px",
            }}
          />
          <p style={{ fontSize: "14px", color: "#a1a1aa", margin: "0 0 8px 0", fontWeight: 600 }}>
            Take the assessment
          </p>
          <p
            style={{
              fontSize: "24px",
              fontWeight: 900,
              margin: 0,
              background: "linear-gradient(135deg, #ea580c 0%, #facc15 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            metabolikal.com
          </p>
        </div>
      </div>
    );
  }
);
