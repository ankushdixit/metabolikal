import posthog from "posthog-js";
import {
  identifyUser,
  resetUser,
  trackEvent,
  setUserProperties,
  isFeatureEnabled,
  getFeatureFlag,
} from "../posthog";

// Mock posthog-js
jest.mock("posthog-js", () => ({
  __esModule: true,
  default: {
    __loaded: true,
    identify: jest.fn(),
    reset: jest.fn(),
    capture: jest.fn(),
    setPersonProperties: jest.fn(),
    isFeatureEnabled: jest.fn(),
    getFeatureFlag: jest.fn(),
  },
}));

describe("posthog utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure __loaded is true by default
    (posthog as unknown as { __loaded: boolean }).__loaded = true;
  });

  describe("identifyUser", () => {
    it("calls posthog.identify when loaded", () => {
      identifyUser("user-123");
      expect(posthog.identify).toHaveBeenCalledWith("user-123", undefined);
    });

    it("calls posthog.identify with properties", () => {
      const props = { email: "test@example.com", name: "Test User" };
      identifyUser("user-123", props);
      expect(posthog.identify).toHaveBeenCalledWith("user-123", props);
    });

    it("does not call posthog.identify when not loaded", () => {
      (posthog as unknown as { __loaded: boolean }).__loaded = false;
      identifyUser("user-123");
      expect(posthog.identify).not.toHaveBeenCalled();
    });
  });

  describe("resetUser", () => {
    it("calls posthog.reset when loaded", () => {
      resetUser();
      expect(posthog.reset).toHaveBeenCalled();
    });

    it("does not call posthog.reset when not loaded", () => {
      (posthog as unknown as { __loaded: boolean }).__loaded = false;
      resetUser();
      expect(posthog.reset).not.toHaveBeenCalled();
    });
  });

  describe("trackEvent", () => {
    it("calls posthog.capture when loaded", () => {
      trackEvent("button_click");
      expect(posthog.capture).toHaveBeenCalledWith("button_click", undefined);
    });

    it("calls posthog.capture with properties", () => {
      const props = { button_id: "cta", page: "home" };
      trackEvent("button_click", props);
      expect(posthog.capture).toHaveBeenCalledWith("button_click", props);
    });

    it("does not call posthog.capture when not loaded", () => {
      (posthog as unknown as { __loaded: boolean }).__loaded = false;
      trackEvent("button_click");
      expect(posthog.capture).not.toHaveBeenCalled();
    });
  });

  describe("setUserProperties", () => {
    it("calls posthog.setPersonProperties when loaded", () => {
      const props = { plan: "premium", role: "admin" };
      setUserProperties(props);
      expect(posthog.setPersonProperties).toHaveBeenCalledWith(props);
    });

    it("does not call posthog.setPersonProperties when not loaded", () => {
      (posthog as unknown as { __loaded: boolean }).__loaded = false;
      setUserProperties({ plan: "free" });
      expect(posthog.setPersonProperties).not.toHaveBeenCalled();
    });
  });

  describe("isFeatureEnabled", () => {
    it("returns true when feature is enabled and loaded", () => {
      (posthog.isFeatureEnabled as jest.Mock).mockReturnValue(true);
      expect(isFeatureEnabled("new-dashboard")).toBe(true);
      expect(posthog.isFeatureEnabled).toHaveBeenCalledWith("new-dashboard");
    });

    it("returns false when feature is disabled and loaded", () => {
      (posthog.isFeatureEnabled as jest.Mock).mockReturnValue(false);
      expect(isFeatureEnabled("new-dashboard")).toBe(false);
    });

    it("returns false when posthog.isFeatureEnabled returns undefined", () => {
      (posthog.isFeatureEnabled as jest.Mock).mockReturnValue(undefined);
      expect(isFeatureEnabled("new-dashboard")).toBe(false);
    });

    it("returns false when posthog.isFeatureEnabled returns null", () => {
      (posthog.isFeatureEnabled as jest.Mock).mockReturnValue(null);
      expect(isFeatureEnabled("new-dashboard")).toBe(false);
    });

    it("returns false when not loaded", () => {
      (posthog as unknown as { __loaded: boolean }).__loaded = false;
      expect(isFeatureEnabled("new-dashboard")).toBe(false);
      expect(posthog.isFeatureEnabled).not.toHaveBeenCalled();
    });
  });

  describe("getFeatureFlag", () => {
    it("returns string value for multivariate flag when loaded", () => {
      (posthog.getFeatureFlag as jest.Mock).mockReturnValue("variant-a");
      expect(getFeatureFlag("experiment-1")).toBe("variant-a");
      expect(posthog.getFeatureFlag).toHaveBeenCalledWith("experiment-1");
    });

    it("returns boolean value when loaded", () => {
      (posthog.getFeatureFlag as jest.Mock).mockReturnValue(true);
      expect(getFeatureFlag("feature-flag")).toBe(true);
    });

    it("returns undefined when flag does not exist", () => {
      (posthog.getFeatureFlag as jest.Mock).mockReturnValue(undefined);
      expect(getFeatureFlag("nonexistent")).toBeUndefined();
    });

    it("returns undefined when not loaded", () => {
      (posthog as unknown as { __loaded: boolean }).__loaded = false;
      expect(getFeatureFlag("experiment-1")).toBeUndefined();
      expect(posthog.getFeatureFlag).not.toHaveBeenCalled();
    });
  });
});
