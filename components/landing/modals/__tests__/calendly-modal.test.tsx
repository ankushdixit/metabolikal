import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendlyModal } from "../calendly-modal";

// Store original requestAnimationFrame
const originalRAF = global.requestAnimationFrame;

describe("CalendlyModal", () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
  };

  const mockInitInlineWidget = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Remove any existing Calendly script from previous tests
    const existingScript = document.getElementById("calendly-script");
    if (existingScript) {
      existingScript.remove();
    }
    // Clear window.Calendly
    delete (window as unknown as Record<string, unknown>).Calendly;

    // Make requestAnimationFrame synchronous for testing
    global.requestAnimationFrame = (cb: (time: number) => void) => {
      cb(0);
      return 0;
    };
  });

  afterEach(() => {
    global.requestAnimationFrame = originalRAF;
  });

  it("renders the modal when open", () => {
    render(<CalendlyModal {...defaultProps} />);
    expect(screen.getByText("Book Your Strategy Call")).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    render(<CalendlyModal {...defaultProps} />);
    expect(screen.getByText("Let's engineer your metabolic transformation")).toBeInTheDocument();
  });

  it("renders the Calendly embed container", () => {
    render(<CalendlyModal {...defaultProps} />);
    const embedContainer = screen.getByTestId("calendly-embed");
    expect(embedContainer).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<CalendlyModal {...defaultProps} open={false} />);
    expect(screen.queryByText("Book Your Strategy Call")).not.toBeInTheDocument();
  });

  it("calls onOpenChange when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<CalendlyModal {...defaultProps} />);

    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("has correct modal structure with header", () => {
    render(<CalendlyModal {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("loads the Calendly script when opened and no script exists", () => {
    render(<CalendlyModal {...defaultProps} />);

    const script = document.getElementById("calendly-script");
    expect(script).toBeInTheDocument();
    expect(script?.getAttribute("src")).toBe(
      "https://assets.calendly.com/assets/external/widget.js"
    );
  });

  it("initializes the Calendly widget when script loads", () => {
    render(<CalendlyModal {...defaultProps} />);

    // Simulate window.Calendly being available after script load
    (window as unknown as Record<string, unknown>).Calendly = {
      initInlineWidget: mockInitInlineWidget,
    };

    // Trigger the script's onload callback
    const script = document.getElementById("calendly-script");
    act(() => {
      script?.dispatchEvent(new Event("load"));
    });

    expect(mockInitInlineWidget).toHaveBeenCalledTimes(1);
    expect(mockInitInlineWidget).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining("calendly.com"),
        parentElement: expect.any(HTMLElement),
      })
    );
  });

  it("initializes widget immediately when script already loaded and Calendly is available", async () => {
    // Pre-add the script and Calendly global
    const script = document.createElement("script");
    script.id = "calendly-script";
    document.head.appendChild(script);
    (window as unknown as Record<string, unknown>).Calendly = {
      initInlineWidget: mockInitInlineWidget,
    };

    // Use a deferred RAF so initWidget runs after the ref is attached
    const rafCallbacks: ((time: number) => void)[] = [];
    global.requestAnimationFrame = (cb: (time: number) => void) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    };

    render(<CalendlyModal {...defaultProps} />);

    // Flush all pending rAF callbacks
    act(() => {
      rafCallbacks.forEach((cb) => cb(0));
    });

    expect(mockInitInlineWidget).toHaveBeenCalledTimes(1);
  });

  it("waits for load event when script exists but Calendly not yet available", () => {
    // Pre-add the script but NOT window.Calendly
    const script = document.createElement("script");
    script.id = "calendly-script";
    document.head.appendChild(script);

    render(<CalendlyModal {...defaultProps} />);

    // Should not have called yet since Calendly not available
    expect(mockInitInlineWidget).not.toHaveBeenCalled();

    // Now simulate the script finishing loading
    (window as unknown as Record<string, unknown>).Calendly = {
      initInlineWidget: mockInitInlineWidget,
    };

    act(() => {
      script.dispatchEvent(new Event("load"));
    });

    expect(mockInitInlineWidget).toHaveBeenCalledTimes(1);
  });

  it("resets initialization flag when modal closes", () => {
    // Use deferred RAF so we can control timing
    const rafCallbacks: ((time: number) => void)[] = [];
    global.requestAnimationFrame = (cb: (time: number) => void) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    };

    const { rerender } = render(<CalendlyModal {...defaultProps} />);

    // Set up Calendly and trigger load
    (window as unknown as Record<string, unknown>).Calendly = {
      initInlineWidget: mockInitInlineWidget,
    };
    const script = document.getElementById("calendly-script");

    // Trigger script onload by dispatching event
    // But our script was added by the component, so onload is set on it
    // Let's use the script directly
    act(() => {
      if (script && (script as HTMLScriptElement).onload) {
        (script as HTMLScriptElement).onload!(new Event("load"));
      }
    });
    // Also flush any pending rAF callbacks
    act(() => {
      rafCallbacks.forEach((cb) => cb(0));
      rafCallbacks.length = 0;
    });
    expect(mockInitInlineWidget).toHaveBeenCalledTimes(1);

    // Close modal
    rerender(<CalendlyModal {...defaultProps} open={false} />);

    // Reopen modal - now script already exists and Calendly is available
    rerender(<CalendlyModal {...defaultProps} open={true} />);

    // Flush rAF callbacks
    act(() => {
      rafCallbacks.forEach((cb) => cb(0));
      rafCallbacks.length = 0;
    });

    // Should initialize again since the flag was reset on close
    expect(mockInitInlineWidget).toHaveBeenCalledTimes(2);
  });

  it("does not initialize widget when container ref is not available", () => {
    // Render closed first - no container ref
    render(<CalendlyModal {...defaultProps} open={false} />);

    // Calendly available but container is not
    (window as unknown as Record<string, unknown>).Calendly = {
      initInlineWidget: mockInitInlineWidget,
    };

    expect(mockInitInlineWidget).not.toHaveBeenCalled();
  });
});
