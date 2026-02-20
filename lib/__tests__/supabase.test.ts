import {
  createServerSupabaseClient,
  testDatabaseConnection,
  resetSupabaseClients,
} from "../supabase";
import { createClient } from "@supabase/supabase-js";

// Mock @supabase/supabase-js
const mockLimit = jest.fn(() =>
  Promise.resolve({ error: null as { code: string; message: string } | null })
);
const mockSelect = jest.fn(() => ({ limit: mockLimit }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));
const mockRpc = jest.fn(() =>
  Promise.resolve({ error: null as { code: string; message: string } | null })
);

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
    rpc: mockRpc,
    auth: {},
    storage: {},
  })),
}));

describe("Supabase client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    resetSupabaseClients();
    jest.clearAllMocks();
    // Reset default mock behavior
    mockLimit.mockResolvedValue({ error: null });
    mockSelect.mockReturnValue({ limit: mockLimit });
    mockFrom.mockReturnValue({ select: mockSelect });
    mockRpc.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const setValidEnv = () => {
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-anon-key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  };

  describe("createServerSupabaseClient", () => {
    it("creates a client when env vars are set", () => {
      setValidEnv();

      const client = createServerSupabaseClient();

      expect(client).toBeDefined();
      expect(client.from).toBeDefined();
      expect(client.auth).toBeDefined();
    });

    it("passes correct config to createClient", () => {
      setValidEnv();

      createServerSupabaseClient();

      expect(createClient).toHaveBeenCalledWith(
        "https://test.supabase.co",
        "test-anon-key",
        expect.objectContaining({
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        })
      );
    });

    it("returns the same instance on subsequent calls", () => {
      setValidEnv();

      const client1 = createServerSupabaseClient();
      const client2 = createServerSupabaseClient();

      expect(client1).toBe(client2);
    });

    it("throws when env vars are missing", () => {
      expect(() => createServerSupabaseClient()).toThrow();
    });
  });

  describe("testDatabaseConnection", () => {
    it("returns true when database is connected (no error)", async () => {
      setValidEnv();

      const result = await testDatabaseConnection();

      expect(result).toBe(true);
    });

    it("returns false when env vars are missing", async () => {
      // No env vars set
      const result = await testDatabaseConnection();

      expect(result).toBe(false);
    });

    it("returns true when error code is PGRST116 (relation does not exist)", async () => {
      setValidEnv();
      mockLimit.mockResolvedValue({
        error: { code: "PGRST116", message: "relation does not exist" },
      });

      const result = await testDatabaseConnection();

      expect(result).toBe(true);
    });

    it("returns true when error code is 42P01 (PostgreSQL relation not found)", async () => {
      setValidEnv();
      mockLimit.mockResolvedValue({
        error: { code: "42P01", message: "relation does not exist" },
      });

      const result = await testDatabaseConnection();

      expect(result).toBe(true);
    });

    it("returns true when initial query fails but RPC version succeeds", async () => {
      setValidEnv();
      mockLimit.mockResolvedValue({
        error: { code: "OTHER_ERROR", message: "some other error" },
      });
      mockRpc.mockResolvedValue({ error: null });

      const result = await testDatabaseConnection();

      expect(result).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith("version");
    });

    it("falls back to message check when both query and RPC fail, message includes 'does not exist'", async () => {
      setValidEnv();
      mockLimit.mockResolvedValue({
        error: { code: "SOME_CODE", message: "table does not exist in this schema" },
      });
      mockRpc.mockResolvedValue({ error: { code: "SOME_RPC_ERROR", message: "rpc failed" } });

      const result = await testDatabaseConnection();

      expect(result).toBe(true);
    });

    it("returns false when both query and RPC fail and message does not include 'does not exist'", async () => {
      setValidEnv();
      mockLimit.mockResolvedValue({
        error: { code: "CONN_ERROR", message: "connection refused" },
      });
      mockRpc.mockResolvedValue({ error: { code: "CONN_ERROR", message: "connection refused" } });

      const result = await testDatabaseConnection();

      expect(result).toBe(false);
    });

    it("returns false when an exception is thrown", async () => {
      setValidEnv();
      mockLimit.mockRejectedValue(new Error("Network error"));

      const result = await testDatabaseConnection();

      expect(result).toBe(false);
    });
  });

  describe("resetSupabaseClients", () => {
    it("clears singleton instances", () => {
      setValidEnv();

      const client1 = createServerSupabaseClient();
      resetSupabaseClients();
      const client2 = createServerSupabaseClient();

      // After reset, should create a new instance
      expect(client1).not.toBe(client2);
    });
  });
});
