/**
 * @jest-environment node
 */

import { GET } from "../route";
import * as supabaseModule from "@/lib/supabase";

// Mock the supabase module
jest.mock("@/lib/supabase", () => ({
  testDatabaseConnection: jest.fn(),
}));

describe("GET /api/health", () => {
  const mockTestDatabaseConnection = supabaseModule.testDatabaseConnection as jest.MockedFunction<
    typeof supabaseModule.testDatabaseConnection
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns status "ok" when database is connected', async () => {
    mockTestDatabaseConnection.mockResolvedValue(true);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.database).toBe("connected");
    expect(data.timestamp).toBeDefined();
    expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
  });

  it('returns status "degraded" with 503 when database is disconnected', async () => {
    mockTestDatabaseConnection.mockResolvedValue(false);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("degraded");
    expect(data.database).toBe("disconnected");
    expect(data.timestamp).toBeDefined();
  });

  it("returns correct response format", async () => {
    mockTestDatabaseConnection.mockResolvedValue(true);

    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty("status");
    expect(data).toHaveProperty("timestamp");
    expect(data).toHaveProperty("database");
    expect(["ok", "degraded"]).toContain(data.status);
    expect(["connected", "disconnected"]).toContain(data.database);
  });

  it("includes valid ISO timestamp", async () => {
    mockTestDatabaseConnection.mockResolvedValue(true);

    const beforeCall = new Date().toISOString();
    const response = await GET();
    const data = await response.json();
    const afterCall = new Date().toISOString();

    // Timestamp should be between before and after the call
    expect(data.timestamp >= beforeCall).toBe(true);
    expect(data.timestamp <= afterCall).toBe(true);
  });
});
