import { NextResponse } from "next/server";
import { testDatabaseConnection } from "@/lib/supabase";

interface HealthCheckResponse {
  status: "ok" | "degraded";
  timestamp: string;
  database: "connected" | "disconnected";
}

export async function GET() {
  const timestamp = new Date().toISOString();

  // Test database connectivity
  const isConnected = await testDatabaseConnection();

  const response: HealthCheckResponse = {
    status: isConnected ? "ok" : "degraded",
    timestamp,
    database: isConnected ? "connected" : "disconnected",
  };

  // Return appropriate status code
  if (isConnected) {
    return NextResponse.json(response, { status: 200 });
  }

  return NextResponse.json(response, { status: 503 });
}
