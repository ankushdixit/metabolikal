/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePushSubscription } from "../use-push-subscription";

// Mock navigator.serviceWorker
const mockServiceWorkerReady = jest.fn();
const mockGetSubscription = jest.fn();
const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();

// Mock PushManager
const mockPushManager = {
  getSubscription: mockGetSubscription,
  subscribe: mockSubscribe,
};

// Mock ServiceWorkerRegistration
const mockRegistration = {
  pushManager: mockPushManager,
};

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock environment variable
const originalEnv = process.env;

describe("usePushSubscription", () => {
  beforeAll(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: "test-vapid-key",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mocks
    mockServiceWorkerReady.mockResolvedValue(mockRegistration);
    mockGetSubscription.mockResolvedValue(null);
    mockSubscribe.mockResolvedValue({
      toJSON: () => ({
        endpoint: "https://push.example.com/test",
        keys: { p256dh: "test-p256dh", auth: "test-auth" },
      }),
      unsubscribe: mockUnsubscribe,
    });
    mockUnsubscribe.mockResolvedValue(true);
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });

    // Setup navigator mock
    Object.defineProperty(global.navigator, "serviceWorker", {
      value: {
        ready: mockServiceWorkerReady(),
      },
      writable: true,
      configurable: true,
    });

    // Mock Notification.permission
    Object.defineProperty(global, "Notification", {
      value: {
        permission: "default",
        requestPermission: jest.fn().mockResolvedValue("granted"),
      },
      writable: true,
      configurable: true,
    });

    // Mock window.PushManager
    Object.defineProperty(global, "PushManager", {
      value: jest.fn(),
      writable: true,
      configurable: true,
    });
  });

  it("returns unsupported state when serviceWorker is not available", async () => {
    // Save current value
    const originalSW = navigator.serviceWorker;

    // Delete serviceWorker property
    delete (navigator as unknown as { serviceWorker?: unknown }).serviceWorker;

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSupported).toBe(false);
    expect(result.current.permission).toBe("unsupported");

    // Restore
    Object.defineProperty(navigator, "serviceWorker", {
      value: originalSW,
      writable: true,
      configurable: true,
    });
  });

  it("returns unsupported state when PushManager is not available", async () => {
    // Save current value
    const originalPM = window.PushManager;

    // Delete PushManager
    delete (window as unknown as { PushManager?: unknown }).PushManager;

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSupported).toBe(false);
    expect(result.current.permission).toBe("unsupported");

    // Restore
    Object.defineProperty(window, "PushManager", {
      value: originalPM,
      writable: true,
      configurable: true,
    });
  });

  it("returns supported state when push APIs are available", async () => {
    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSupported).toBe(true);
    expect(result.current.permission).toBe("default");
    expect(result.current.isSubscribed).toBe(false);
  });

  it("returns subscribed state when already subscribed", async () => {
    const existingSubscription = {
      endpoint: "https://push.example.com/existing",
      unsubscribe: mockUnsubscribe,
    };
    mockGetSubscription.mockResolvedValue(existingSubscription);
    // Hook now calls /api/push/verify to check if browser subscription is backed by DB
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ exists: true }) });

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSubscribed).toBe(true);
  });

  it("subscribe returns false when not supported", async () => {
    // Save current value
    const originalSW = navigator.serviceWorker;

    // Delete serviceWorker property
    delete (navigator as unknown as { serviceWorker?: unknown }).serviceWorker;

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success = false;
    await act(async () => {
      success = await result.current.subscribe();
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Push notifications are not supported on this device");

    // Restore
    Object.defineProperty(navigator, "serviceWorker", {
      value: originalSW,
      writable: true,
      configurable: true,
    });
  });

  it("subscribe returns false when permission denied", async () => {
    (Notification.requestPermission as jest.Mock).mockResolvedValue("denied");

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success = false;
    await act(async () => {
      success = await result.current.subscribe();
    });

    expect(success).toBe(false);
    expect(result.current.permission).toBe("denied");
    expect(result.current.error).toBe("Notification permission denied");
  });

  it("subscribe successfully subscribes when permission granted", async () => {
    mockServiceWorkerReady.mockResolvedValue(mockRegistration);

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success = false;
    await act(async () => {
      success = await result.current.subscribe();
    });

    expect(success).toBe(true);
    expect(result.current.isSubscribed).toBe(true);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/push/subscribe",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  it("subscribe returns false when API call fails", async () => {
    // Hook now reads response.json() and response.status on failure
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) });

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success = false;
    await act(async () => {
      success = await result.current.subscribe();
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Server returned 500");
  });

  it("unsubscribe removes subscription", async () => {
    const existingSubscription = {
      endpoint: "https://push.example.com/existing",
      unsubscribe: mockUnsubscribe,
    };
    mockGetSubscription.mockResolvedValue(existingSubscription);
    mockServiceWorkerReady.mockResolvedValue({
      pushManager: {
        getSubscription: mockGetSubscription,
        subscribe: mockSubscribe,
      },
    });

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success = false;
    await act(async () => {
      success = await result.current.unsubscribe();
    });

    expect(success).toBe(true);
    expect(result.current.isSubscribed).toBe(false);
    expect(mockUnsubscribe).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/push/unsubscribe",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ endpoint: "https://push.example.com/existing" }),
      })
    );
  });

  // ── Branch coverage: Notification API not available ──
  it("returns unsupported when Notification API is not available", async () => {
    const originalNotification = global.Notification;
    delete (global as unknown as { Notification?: unknown }).Notification;

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSupported).toBe(false);
    expect(result.current.permission).toBe("unsupported");
    expect(result.current.error).toBe("Notifications API is not available");

    Object.defineProperty(global, "Notification", {
      value: originalNotification,
      writable: true,
      configurable: true,
    });
  });

  // ── Branch coverage: orphan subscription cleanup (DB says not exists) ──
  it("cleans up orphan subscription when DB does not have a record", async () => {
    const orphanUnsubscribe = jest.fn().mockResolvedValue(true);
    const existingSubscription = {
      endpoint: "https://push.example.com/orphan",
      unsubscribe: orphanUnsubscribe,
    };
    mockGetSubscription.mockResolvedValue(existingSubscription);
    // verify endpoint returns exists: false
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ exists: false }),
    });

    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSubscribed).toBe(false);
    expect(orphanUnsubscribe).toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith("Orphan push subscription found, cleaning up");

    consoleWarnSpy.mockRestore();
  });

  // ── Branch coverage: verify fetch throws (trust browser state) ──
  it("trusts browser subscription state when verify fetch fails", async () => {
    const existingSubscription = {
      endpoint: "https://push.example.com/existing",
      unsubscribe: mockUnsubscribe,
    };
    mockGetSubscription.mockResolvedValue(existingSubscription);
    // verify fetch throws
    mockFetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should trust the browser and show as subscribed
    expect(result.current.isSubscribed).toBe(true);
  });

  // ── Branch coverage: service worker ready times out in useEffect ──
  it("handles error when service worker ready times out during init", async () => {
    // Override navigator.serviceWorker.ready to reject
    Object.defineProperty(global.navigator, "serviceWorker", {
      value: {
        ready: Promise.reject(new Error("Service worker not ready")),
      },
      writable: true,
      configurable: true,
    });

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should still be supported (checks passed), just no subscription info
    expect(result.current.isSupported).toBe(true);
    expect(result.current.isSubscribed).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  // ── Branch coverage: subscribe with API error containing error field ──
  it("shows API error message when response body has error field", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ error: "Subscription limit reached" }),
    });

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success = false;
    await act(async () => {
      success = await result.current.subscribe();
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Subscription limit reached");
  });

  // ── Branch coverage: subscribe API json parsing fails on error response ──
  it("falls back to status code when error response json parsing fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success = false;
    await act(async () => {
      success = await result.current.subscribe();
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Server returned 502");

    consoleErrorSpy.mockRestore();
  });

  // ── Branch coverage: subscribe error message mapping for "The operation was aborted." ──
  it("maps abort error to user-friendly timeout message", async () => {
    mockFetch.mockRejectedValue(new Error("The operation was aborted."));

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success = false;
    await act(async () => {
      success = await result.current.subscribe();
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Request timed out — please try again");

    consoleErrorSpy.mockRestore();
  });

  // ── Branch coverage: subscribe error message mapping for "Service worker not ready" ──
  it("maps service worker not ready error to user-friendly message", async () => {
    // Make navigator.serviceWorker.ready reject for the subscribe call
    // First call succeeds (init), then we need to mock for subscribe
    // We need to override navigator.serviceWorker.ready to a rejecting promise
    // after initialization
    Object.defineProperty(global.navigator, "serviceWorker", {
      value: {
        // Initial ready succeeds, but after subscribe is called it will use getRegistrationWithTimeout
        // which reads navigator.serviceWorker.ready again
        get ready() {
          return Promise.reject(new Error("Service worker not ready"));
        },
      },
      writable: true,
      configurable: true,
    });

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success = false;
    await act(async () => {
      success = await result.current.subscribe();
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe(
      "Notifications setup timed out — please reload and try again"
    );

    consoleErrorSpy.mockRestore();
  });

  // ── Branch coverage: subscribe error with non-Error thrown ──
  it("handles non-Error thrown during subscribe", async () => {
    // Make pushManager.subscribe throw a non-Error
    mockSubscribe.mockRejectedValue("string error");

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success = false;
    await act(async () => {
      success = await result.current.subscribe();
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Failed to subscribe");

    consoleErrorSpy.mockRestore();
  });

  // ── Branch coverage: VAPID key missing ──
  it("throws error when VAPID public key is not configured", async () => {
    const savedKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success = false;
    await act(async () => {
      success = await result.current.subscribe();
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("VAPID public key not configured");

    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = savedKey;
    consoleErrorSpy.mockRestore();
  });

  // ── Branch coverage: unsubscribe with no existing subscription ──
  it("unsubscribes successfully even when no subscription exists", async () => {
    // getSubscription returns null
    mockGetSubscription.mockResolvedValue(null);
    mockServiceWorkerReady.mockResolvedValue({
      pushManager: {
        getSubscription: mockGetSubscription,
        subscribe: mockSubscribe,
      },
    });

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success = false;
    await act(async () => {
      success = await result.current.unsubscribe();
    });

    expect(success).toBe(true);
    expect(result.current.isSubscribed).toBe(false);
    // Should not have called fetch to unsubscribe from server since no subscription
    expect(mockFetch).not.toHaveBeenCalledWith("/api/push/unsubscribe", expect.anything());
  });

  // ── Branch coverage: unsubscribe error path ──
  it("handles error during unsubscribe", async () => {
    // Make getRegistrationWithTimeout reject
    Object.defineProperty(global.navigator, "serviceWorker", {
      value: {
        ready: Promise.reject(new Error("SW crashed")),
      },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success = false;
    await act(async () => {
      success = await result.current.unsubscribe();
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("SW crashed");
  });

  // ── Branch coverage: getDeviceType returns "tablet" for tablet user agents ──
  it("sends tablet device type for tablet user agents", async () => {
    const originalUA = navigator.userAgent;
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1",
      writable: true,
      configurable: true,
    });

    mockServiceWorkerReady.mockResolvedValue(mockRegistration);

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/push/subscribe",
      expect.objectContaining({
        body: expect.stringContaining('"deviceType":"tablet"'),
      })
    );

    Object.defineProperty(navigator, "userAgent", {
      value: originalUA,
      writable: true,
      configurable: true,
    });
  });

  // ── Branch coverage: getDeviceType returns "mobile" for mobile user agents ──
  it("sends mobile device type for mobile user agents", async () => {
    const originalUA = navigator.userAgent;
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1",
      writable: true,
      configurable: true,
    });

    mockServiceWorkerReady.mockResolvedValue(mockRegistration);

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/push/subscribe",
      expect.objectContaining({
        body: expect.stringContaining('"deviceType":"mobile"'),
      })
    );

    Object.defineProperty(navigator, "userAgent", {
      value: originalUA,
      writable: true,
      configurable: true,
    });
  });

  // ── Branch coverage: getBrowserName branches ──
  it("detects Firefox browser", async () => {
    const originalUA = navigator.userAgent;
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Windows NT 10.0; rv:120.0) Gecko/20100101 Firefox/120.0",
      writable: true,
      configurable: true,
    });

    mockServiceWorkerReady.mockResolvedValue(mockRegistration);

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/push/subscribe",
      expect.objectContaining({
        body: expect.stringContaining('"browser":"firefox"'),
      })
    );

    Object.defineProperty(navigator, "userAgent", {
      value: originalUA,
      writable: true,
      configurable: true,
    });
  });

  it("detects Edge browser", async () => {
    const originalUA = navigator.userAgent;
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120.0 Edg/120.0",
      writable: true,
      configurable: true,
    });

    mockServiceWorkerReady.mockResolvedValue(mockRegistration);

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/push/subscribe",
      expect.objectContaining({
        body: expect.stringContaining('"browser":"edge"'),
      })
    );

    Object.defineProperty(navigator, "userAgent", {
      value: originalUA,
      writable: true,
      configurable: true,
    });
  });

  it("detects Samsung browser", async () => {
    const originalUA = navigator.userAgent;
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Linux; Android 13) SamsungBrowser/21.0 Chrome/110.0",
      writable: true,
      configurable: true,
    });

    mockServiceWorkerReady.mockResolvedValue(mockRegistration);

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/push/subscribe",
      expect.objectContaining({
        body: expect.stringContaining('"browser":"samsung"'),
      })
    );

    Object.defineProperty(navigator, "userAgent", {
      value: originalUA,
      writable: true,
      configurable: true,
    });
  });

  it("detects Safari browser", async () => {
    const originalUA = navigator.userAgent;
    Object.defineProperty(navigator, "userAgent", {
      value:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/16.0 Safari/605.1.15",
      writable: true,
      configurable: true,
    });

    mockServiceWorkerReady.mockResolvedValue(mockRegistration);

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/push/subscribe",
      expect.objectContaining({
        body: expect.stringContaining('"browser":"safari"'),
      })
    );

    Object.defineProperty(navigator, "userAgent", {
      value: originalUA,
      writable: true,
      configurable: true,
    });
  });

  it("detects Chrome browser", async () => {
    const originalUA = navigator.userAgent;
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      writable: true,
      configurable: true,
    });

    mockServiceWorkerReady.mockResolvedValue(mockRegistration);

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/push/subscribe",
      expect.objectContaining({
        body: expect.stringContaining('"browser":"chrome"'),
      })
    );

    Object.defineProperty(navigator, "userAgent", {
      value: originalUA,
      writable: true,
      configurable: true,
    });
  });

  it("detects Chrome iOS (CriOS) browser", async () => {
    const originalUA = navigator.userAgent;
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1 CriOS/120.0",
      writable: true,
      configurable: true,
    });

    mockServiceWorkerReady.mockResolvedValue(mockRegistration);

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/push/subscribe",
      expect.objectContaining({
        body: expect.stringContaining('"browser":"chrome"'),
      })
    );

    Object.defineProperty(navigator, "userAgent", {
      value: originalUA,
      writable: true,
      configurable: true,
    });
  });

  it("returns unknown browser for unrecognized user agents", async () => {
    const originalUA = navigator.userAgent;
    Object.defineProperty(navigator, "userAgent", {
      value: "SomeFutureBrowser/1.0",
      writable: true,
      configurable: true,
    });

    mockServiceWorkerReady.mockResolvedValue(mockRegistration);

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/push/subscribe",
      expect.objectContaining({
        body: expect.stringContaining('"browser":"unknown"'),
      })
    );

    Object.defineProperty(navigator, "userAgent", {
      value: originalUA,
      writable: true,
      configurable: true,
    });
  });

  // ── Branch coverage: unsubscribe error with non-Error thrown ──
  it("handles non-Error thrown during unsubscribe", async () => {
    Object.defineProperty(global.navigator, "serviceWorker", {
      value: {
        ready: Promise.reject("not an error object"),
      },
      writable: true,
      configurable: true,
    });

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success = false;
    await act(async () => {
      success = await result.current.unsubscribe();
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Failed to unsubscribe");

    consoleErrorSpy.mockRestore();
  });
});
