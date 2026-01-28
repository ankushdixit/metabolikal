/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PushPermissionPrompt } from "../push-permission-prompt";

// Mock the usePushSubscription hook
const mockSubscribe = jest.fn();
const mockUsePushSubscription = {
  isSupported: true,
  permission: "default" as globalThis.NotificationPermission,
  isSubscribed: false,
  isLoading: false,
  subscribe: mockSubscribe,
  unsubscribe: jest.fn(),
  error: null,
};

jest.mock("@/hooks/use-push-subscription", () => ({
  usePushSubscription: () => mockUsePushSubscription,
}));

// Mock localStorage
const mockLocalStorage: { [key: string]: string } = {};
const localStorageMock = {
  getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockLocalStorage[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete mockLocalStorage[key];
  }),
  clear: jest.fn(() => {
    Object.keys(mockLocalStorage).forEach((key) => delete mockLocalStorage[key]);
  }),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("PushPermissionPrompt", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    localStorageMock.clear();
    mockUsePushSubscription.isSupported = true;
    mockUsePushSubscription.permission = "default";
    mockUsePushSubscription.isSubscribed = false;
    mockUsePushSubscription.isLoading = false;
    mockUsePushSubscription.error = null;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not show prompt initially", () => {
    render(<PushPermissionPrompt delay={5000} />);

    expect(screen.queryByText("Stay Updated")).not.toBeInTheDocument();
  });

  it("shows prompt after delay", async () => {
    render(<PushPermissionPrompt delay={5000} />);

    // Advance timer past delay
    jest.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(screen.getByText("Stay Updated")).toBeInTheDocument();
    });
  });

  it("does not show prompt if not supported", () => {
    mockUsePushSubscription.isSupported = false;

    render(<PushPermissionPrompt delay={100} />);
    jest.advanceTimersByTime(100);

    expect(screen.queryByText("Stay Updated")).not.toBeInTheDocument();
  });

  it("does not show prompt if already subscribed", () => {
    mockUsePushSubscription.isSubscribed = true;

    render(<PushPermissionPrompt delay={100} />);
    jest.advanceTimersByTime(100);

    expect(screen.queryByText("Stay Updated")).not.toBeInTheDocument();
  });

  it("does not show prompt if permission denied", () => {
    mockUsePushSubscription.permission = "denied";

    render(<PushPermissionPrompt delay={100} />);
    jest.advanceTimersByTime(100);

    expect(screen.queryByText("Stay Updated")).not.toBeInTheDocument();
  });

  it("does not show prompt while loading", () => {
    mockUsePushSubscription.isLoading = true;

    render(<PushPermissionPrompt delay={100} />);
    jest.advanceTimersByTime(100);

    expect(screen.queryByText("Stay Updated")).not.toBeInTheDocument();
  });

  it("does not show prompt if recently dismissed", () => {
    const recentTimestamp = (Date.now() - 1000 * 60 * 60).toString(); // 1 hour ago
    localStorageMock.getItem.mockReturnValue(recentTimestamp);

    render(<PushPermissionPrompt delay={100} />);
    jest.advanceTimersByTime(100);

    expect(screen.queryByText("Stay Updated")).not.toBeInTheDocument();
  });

  it("shows prompt if dismissed more than a week ago", async () => {
    const oldTimestamp = (Date.now() - 1000 * 60 * 60 * 24 * 8).toString(); // 8 days ago
    localStorageMock.getItem.mockReturnValue(oldTimestamp);

    render(<PushPermissionPrompt delay={100} />);
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(screen.getByText("Stay Updated")).toBeInTheDocument();
    });
  });

  it("calls subscribe when Enable button is clicked", async () => {
    mockSubscribe.mockResolvedValue(true);

    render(<PushPermissionPrompt delay={100} />);
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(screen.getByText("Enable Notifications")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Enable Notifications"));

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled();
    });
  });

  it("dismisses prompt and saves timestamp when Later is clicked", async () => {
    render(<PushPermissionPrompt delay={100} />);
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(screen.getByText("Later")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Later"));

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "push-prompt-dismissed",
      expect.any(String)
    );
    expect(screen.queryByText("Stay Updated")).not.toBeInTheDocument();
  });

  it("dismisses prompt when X button is clicked", async () => {
    render(<PushPermissionPrompt delay={100} />);
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(screen.getByText("Stay Updated")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Dismiss"));

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "push-prompt-dismissed",
      expect.any(String)
    );
    expect(screen.queryByText("Stay Updated")).not.toBeInTheDocument();
  });

  it("displays error message when subscription fails", async () => {
    // Temporarily cast to allow setting error for test
    (mockUsePushSubscription as { error: string | null }).error = "Test error message";

    render(<PushPermissionPrompt delay={100} />);
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(screen.getByText("Test error message")).toBeInTheDocument();
    });

    // Reset error
    (mockUsePushSubscription as { error: string | null }).error = null;
  });

  it("hides prompt after successful subscription", async () => {
    mockSubscribe.mockResolvedValue(true);

    render(<PushPermissionPrompt delay={100} />);
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(screen.getByText("Enable Notifications")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Enable Notifications"));

    await waitFor(() => {
      expect(screen.queryByText("Stay Updated")).not.toBeInTheDocument();
    });
  });
});
