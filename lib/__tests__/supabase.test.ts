import {
  createServerSupabaseClient,
  createBrowserSupabaseClient,
  getSupabaseClient,
  testDatabaseConnection,
  resetSupabaseClients,
} from "../supabase";

// Mock @supabase/supabase-js
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    rpc: jest.fn(() => Promise.resolve({ error: null })),
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

  describe("createBrowserSupabaseClient", () => {
    it("creates a client when env vars are set", () => {
      setValidEnv();

      const client = createBrowserSupabaseClient();

      expect(client).toBeDefined();
      expect(client.from).toBeDefined();
    });

    it("returns the same instance on subsequent calls", () => {
      setValidEnv();

      const client1 = createBrowserSupabaseClient();
      const client2 = createBrowserSupabaseClient();

      expect(client1).toBe(client2);
    });

    it("throws when client env vars are missing", () => {
      // Only set server env vars
      process.env.SUPABASE_URL = "https://test.supabase.co";
      process.env.SUPABASE_ANON_KEY = "test-anon-key";

      expect(() => createBrowserSupabaseClient()).toThrow();
    });
  });

  describe("getSupabaseClient", () => {
    it("returns server client when not in browser", () => {
      setValidEnv();

      // In Node.js test environment, window is undefined
      const client = getSupabaseClient();

      expect(client).toBeDefined();
    });
  });

  describe("testDatabaseConnection", () => {
    it("returns true when database is connected", async () => {
      setValidEnv();

      const result = await testDatabaseConnection();

      expect(result).toBe(true);
    });

    it("returns false when env vars are missing", async () => {
      // No env vars set
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
