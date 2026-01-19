import {
  refineDataProvider,
  createRefineDataProvider,
  refineResources,
  refineOptions,
  refineRouterProvider,
} from "../refine";

describe("refineDataProvider", () => {
  describe("createRefineDataProvider", () => {
    it("returns null when environment variables are not set", () => {
      // In test environment without Supabase env vars, should return null
      const provider = createRefineDataProvider();
      // Since env vars are not set in tests, this should be null
      expect(provider).toBeNull();
    });
  });

  describe("refineDataProvider export", () => {
    it("is null when env vars are not configured", () => {
      // The exported refineDataProvider should be null in test env
      expect(refineDataProvider).toBeNull();
    });
  });
});

describe("refineResources", () => {
  it("starts as an empty array", () => {
    expect(refineResources).toEqual([]);
  });

  it("is an array", () => {
    expect(Array.isArray(refineResources)).toBe(true);
  });
});

describe("refineOptions", () => {
  it("has correct default options", () => {
    expect(refineOptions.syncWithLocation).toBe(true);
    expect(refineOptions.warnWhenUnsavedChanges).toBe(true);
    expect(refineOptions.useNewQueryKeys).toBe(true);
    expect(refineOptions.projectId).toBe("refine-dashboard");
  });
});

describe("refineRouterProvider", () => {
  it("is defined", () => {
    expect(refineRouterProvider).toBeDefined();
  });
});
