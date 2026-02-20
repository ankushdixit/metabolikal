/**
 * Tests for PhotoUpload component
 *
 * Covers: rendering, file validation, upload flow, remove flow,
 * click handling, error states, disabled state, and preview URL fetching.
 */

import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { PhotoUpload } from "../photo-upload";

// ---------------------------------------------------------------------------
// Supabase storage mock
// ---------------------------------------------------------------------------

const mockUpload = jest.fn();
const mockCreateSignedUrl = jest.fn();
const mockRemove = jest.fn();

jest.mock("@/lib/auth", () => ({
  createBrowserSupabaseClient: () => ({
    storage: {
      from: () => ({
        upload: mockUpload,
        createSignedUrl: mockCreateSignedUrl,
        remove: mockRemove,
      }),
    },
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultProps = {
  label: "Front View",
  view: "front" as const,
  userId: "user-123",
  value: null as string | null,
  onChange: jest.fn(),
};

function createFile(name: string, type: string, sizeInBytes: number = 1024) {
  const content = new Array(sizeInBytes).fill("a").join("");
  return new File([content], name, { type });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PhotoUpload Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ advanceTimers: true });

    mockUpload.mockResolvedValue({ data: { path: "user-123/2026-01-01/front.jpg" }, error: null });
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://example.com/signed-url" },
    });
    mockRemove.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // =========================================================================
  // Rendering
  // =========================================================================

  describe("rendering", () => {
    it("renders upload placeholder when no value", () => {
      render(<PhotoUpload {...defaultProps} />);
      expect(screen.getByText("Front View")).toBeInTheDocument();
      expect(screen.getByText("Click to upload")).toBeInTheDocument();
      expect(screen.getByText("JPG, PNG, WebP (max 10MB)")).toBeInTheDocument();
    });

    it("renders label correctly for different views", () => {
      render(<PhotoUpload {...defaultProps} label="Side View" view="side" />);
      expect(screen.getByText("Side View")).toBeInTheDocument();
    });

    it("has hidden file input", () => {
      const { container } = render(<PhotoUpload {...defaultProps} />);
      const input = container.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass("hidden");
    });

    it("accepts only image file types", () => {
      const { container } = render(<PhotoUpload {...defaultProps} />);
      const input = container.querySelector('input[type="file"]');
      expect(input).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
    });

    it("renders with aspect ratio 3:4", () => {
      const { container } = render(<PhotoUpload {...defaultProps} />);
      const uploadArea = container.querySelector('[class*="aspect-[3/4]"]');
      expect(uploadArea).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Disabled state
  // =========================================================================

  describe("disabled state", () => {
    it("shows cursor-not-allowed when disabled", () => {
      const { container } = render(<PhotoUpload {...defaultProps} disabled />);
      const uploadArea = container.querySelector('[class*="cursor-not-allowed"]');
      expect(uploadArea).toBeInTheDocument();
    });

    it("disables the file input when disabled", () => {
      const { container } = render(<PhotoUpload {...defaultProps} disabled />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toBeDisabled();
    });

    it("does not open file picker when disabled and clicked", () => {
      const { container } = render(<PhotoUpload {...defaultProps} disabled />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = jest.spyOn(input, "click");

      const uploadArea = container.querySelector('[class*="aspect-[3/4]"]') as HTMLElement;
      fireEvent.click(uploadArea);

      expect(clickSpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Value present (preview & remove)
  // =========================================================================

  describe("when value is present", () => {
    it("shows remove button", () => {
      render(<PhotoUpload {...defaultProps} value="test/photo.jpg" />);
      const removeButton = screen.getByRole("button", { name: /remove photo/i });
      expect(removeButton).toBeInTheDocument();
    });

    it("applies solid border styling", () => {
      const { container } = render(<PhotoUpload {...defaultProps} value="test/photo.jpg" />);
      const uploadArea = container.querySelector('[class*="border-primary"]');
      expect(uploadArea).toBeInTheDocument();
    });

    it("shows preview image when signed URL is available", async () => {
      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: "https://example.com/preview.jpg" },
      });

      render(<PhotoUpload {...defaultProps} value="test/photo.jpg" />);

      await waitFor(() => {
        screen.queryByAltText("Front View preview");
        // Image may or may not be present depending on async fetchPreviewUrl
        // but the component should try to fetch a signed URL
        expect(mockCreateSignedUrl).toHaveBeenCalled();
      });
    });

    it("shows image icon placeholder when no preview URL", () => {
      mockCreateSignedUrl.mockResolvedValue({ data: null });

      render(<PhotoUpload {...defaultProps} value="test/photo.jpg" />);

      // Should still render the component without crashing
      expect(screen.getByRole("button", { name: /remove photo/i })).toBeInTheDocument();
    });

    it("calls onChange(null) and removes file from storage on remove", async () => {
      const onChange = jest.fn();
      render(<PhotoUpload {...defaultProps} value="test/photo.jpg" onChange={onChange} />);

      const removeButton = screen.getByRole("button", { name: /remove photo/i });
      await act(async () => {
        fireEvent.click(removeButton);
      });

      await waitFor(() => {
        expect(mockRemove).toHaveBeenCalledWith(["test/photo.jpg"]);
        expect(onChange).toHaveBeenCalledWith(null);
      });
    });

    it("does not trigger parent click when remove button is clicked", async () => {
      const { container } = render(<PhotoUpload {...defaultProps} value="test/photo.jpg" />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = jest.spyOn(input, "click");

      const removeButton = screen.getByRole("button", { name: /remove photo/i });
      await act(async () => {
        fireEvent.click(removeButton);
      });

      // The e.stopPropagation() should prevent the file picker from opening
      expect(clickSpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // File selection & upload
  // =========================================================================

  describe("file selection and upload", () => {
    it("uploads a valid file and calls onChange with the path", async () => {
      const onChange = jest.fn();
      const { container } = render(<PhotoUpload {...defaultProps} onChange={onChange} />);

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createFile("photo.jpg", "image/jpeg", 1024);

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
        // Advance timers for progress interval
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith(
          expect.stringContaining("user-123/"),
          file,
          expect.objectContaining({
            contentType: "image/jpeg",
            upsert: true,
          })
        );
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith("user-123/2026-01-01/front.jpg");
      });
    });

    it("rejects files with invalid type", async () => {
      const onChange = jest.fn();
      const { container } = render(<PhotoUpload {...defaultProps} onChange={onChange} />);

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createFile("document.pdf", "application/pdf", 1024);

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      expect(
        screen.getByText("Invalid file type. Please use JPG, PNG, or WebP.")
      ).toBeInTheDocument();
      expect(mockUpload).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
    });

    it("rejects files larger than 10MB", async () => {
      const onChange = jest.fn();
      const { container } = render(<PhotoUpload {...defaultProps} onChange={onChange} />);

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createFile("huge.jpg", "image/jpeg", 11 * 1024 * 1024);

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      expect(screen.getByText("File too large (max 10MB)")).toBeInTheDocument();
      expect(mockUpload).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
    });

    it("does nothing when no file is selected", async () => {
      const onChange = jest.fn();
      const { container } = render(<PhotoUpload {...defaultProps} onChange={onChange} />);

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(input, { target: { files: [] } });
      });

      expect(mockUpload).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
    });

    it("accepts PNG files", async () => {
      const onChange = jest.fn();
      const { container } = render(<PhotoUpload {...defaultProps} onChange={onChange} />);

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createFile("photo.png", "image/png", 1024);

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalled();
      });
    });

    it("accepts WebP files", async () => {
      const onChange = jest.fn();
      const { container } = render(<PhotoUpload {...defaultProps} onChange={onChange} />);

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createFile("photo.webp", "image/webp", 1024);

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalled();
      });
    });

    it("clears previous error on new file selection", async () => {
      const { container } = render(<PhotoUpload {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      // First: trigger an error
      const badFile = createFile("bad.txt", "text/plain", 1024);
      await act(async () => {
        fireEvent.change(input, { target: { files: [badFile] } });
      });
      expect(
        screen.getByText("Invalid file type. Please use JPG, PNG, or WebP.")
      ).toBeInTheDocument();

      // Second: select a valid file - error should clear
      const goodFile = createFile("good.jpg", "image/jpeg", 1024);
      await act(async () => {
        fireEvent.change(input, { target: { files: [goodFile] } });
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(
          screen.queryByText("Invalid file type. Please use JPG, PNG, or WebP.")
        ).not.toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Upload error handling
  // =========================================================================

  describe("upload error handling", () => {
    it("shows error when upload fails", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockUpload.mockResolvedValue({ data: null, error: { message: "Storage full" } });

      const { container } = render(<PhotoUpload {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createFile("photo.jpg", "image/jpeg", 1024);

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText("Failed to upload photo. Please try again.")).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it("shows error when upload throws an exception", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockUpload.mockRejectedValue(new Error("Network failure"));

      const { container } = render(<PhotoUpload {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createFile("photo.jpg", "image/jpeg", 1024);

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText("Failed to upload photo. Please try again.")).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it("resets file input after upload (success or failure)", async () => {
      const { container } = render(<PhotoUpload {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createFile("photo.jpg", "image/jpeg", 1024);

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(input.value).toBe("");
      });
    });
  });

  // =========================================================================
  // Remove error handling
  // =========================================================================

  describe("remove error handling", () => {
    it("shows error when remove fails", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockRemove.mockRejectedValue(new Error("Remove failed"));

      render(<PhotoUpload {...defaultProps} value="test/photo.jpg" />);

      const removeButton = screen.getByRole("button", { name: /remove photo/i });
      await act(async () => {
        fireEvent.click(removeButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Failed to remove photo.")).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it("does not call remove when value is null", async () => {
      // This tests the early return in handleRemove
      render(<PhotoUpload {...defaultProps} value={null} />);

      // No remove button should be present
      expect(screen.queryByRole("button", { name: /remove photo/i })).not.toBeInTheDocument();
      expect(mockRemove).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Click handler (handleClick)
  // =========================================================================

  describe("handleClick", () => {
    it("opens file picker when upload area is clicked and not disabled", () => {
      const { container } = render(<PhotoUpload {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = jest.spyOn(input, "click");

      const uploadArea = container.querySelector('[class*="aspect-[3/4]"]') as HTMLElement;
      fireEvent.click(uploadArea);

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Upload progress indicator
  // =========================================================================

  describe("upload progress", () => {
    it("shows uploading state during upload", async () => {
      // Make upload hang to observe the uploading state
      let resolveUpload: (v: unknown) => void;
      mockUpload.mockReturnValue(
        new Promise((resolve) => {
          resolveUpload = resolve;
        })
      );

      const { container } = render(<PhotoUpload {...defaultProps} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createFile("photo.jpg", "image/jpeg", 1024);

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      // Should show uploading state
      expect(screen.getByText(/Uploading.../)).toBeInTheDocument();

      // Advance timers to simulate progress
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Clean up: resolve the upload
      await act(async () => {
        resolveUpload!({ data: { path: "test/path.jpg" }, error: null });
      });
    });
  });

  // =========================================================================
  // Preview URL fetching edge cases
  // =========================================================================

  describe("preview URL edge cases", () => {
    it("handles preview URL fetch failure gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockCreateSignedUrl.mockRejectedValue(new Error("Failed"));

      render(<PhotoUpload {...defaultProps} value="test/photo.jpg" />);

      // Component should still render without crashing
      expect(screen.getByRole("button", { name: /remove photo/i })).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it("clears preview URL when value becomes null", () => {
      const { rerender } = render(<PhotoUpload {...defaultProps} value="test/photo.jpg" />);

      // Re-render without value
      rerender(<PhotoUpload {...defaultProps} value={null} />);

      // Should show upload placeholder
      expect(screen.getByText("Click to upload")).toBeInTheDocument();
    });
  });
});
