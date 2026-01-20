import { validateEnv, validateClientEnv, getEnvSafe } from "../env";

describe("Environment validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("validateEnv", () => {
    it("returns validated env when all required variables are set", () => {
      process.env.SUPABASE_URL = "https://test.supabase.co";
      process.env.SUPABASE_ANON_KEY = "test-anon-key";
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

      const env = validateEnv();

      expect(env.SUPABASE_URL).toBe("https://test.supabase.co");
      expect(env.SUPABASE_ANON_KEY).toBe("test-anon-key");
      expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://test.supabase.co");
      expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("test-anon-key");
    });

    it("throws error when SUPABASE_URL is missing", () => {
      process.env.SUPABASE_ANON_KEY = "test-anon-key";
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

      expect(() => validateEnv()).toThrow("SUPABASE_URL");
    });

    it("throws error when SUPABASE_ANON_KEY is missing", () => {
      process.env.SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

      expect(() => validateEnv()).toThrow("SUPABASE_ANON_KEY");
    });

    it("throws error when SUPABASE_URL is not a valid URL", () => {
      process.env.SUPABASE_URL = "not-a-url";
      process.env.SUPABASE_ANON_KEY = "test-anon-key";
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

      expect(() => validateEnv()).toThrow("must be a valid URL");
    });

    it("includes optional SUPABASE_SERVICE_ROLE_KEY when provided", () => {
      process.env.SUPABASE_URL = "https://test.supabase.co";
      process.env.SUPABASE_ANON_KEY = "test-anon-key";
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

      const env = validateEnv();

      expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe("service-role-key");
    });
  });

  describe("validateClientEnv", () => {
    it("returns validated env when client variables are set", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

      const env = validateClientEnv();

      expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://test.supabase.co");
      expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("test-anon-key");
    });

    it("throws error when NEXT_PUBLIC_SUPABASE_URL is missing", () => {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

      expect(() => validateClientEnv()).toThrow("NEXT_PUBLIC_SUPABASE_URL");
    });

    it("throws error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";

      expect(() => validateClientEnv()).toThrow("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    });
  });

  describe("getEnvSafe", () => {
    it("returns env when validation succeeds", () => {
      process.env.SUPABASE_URL = "https://test.supabase.co";
      process.env.SUPABASE_ANON_KEY = "test-anon-key";
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

      const env = getEnvSafe();

      expect(env).not.toBeNull();
      // Check for a property that exists on both Env and ClientEnv types
      expect(env?.NEXT_PUBLIC_SUPABASE_URL).toBe("https://test.supabase.co");
    });

    it("returns null when validation fails", () => {
      // No env vars set
      const env = getEnvSafe();

      expect(env).toBeNull();
    });
  });
});
