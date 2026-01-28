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
    mockFetch.mockResolvedValue({ ok: false });

    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success = false;
    await act(async () => {
      success = await result.current.subscribe();
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Failed to save subscription");
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
});
