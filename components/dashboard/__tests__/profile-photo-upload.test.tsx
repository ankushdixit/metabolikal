import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProfilePhotoUpload } from "../profile-photo-upload";

// Mock Supabase client
const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn();
const mockRemove = jest.fn();
const mockUpdate = jest.fn();

jest.mock("@/lib/auth", () => ({
  createBrowserSupabaseClient: () => ({
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: mockRemove,
      }),
    },
    from: () => ({
      update: mockUpdate,
    }),
  }),
}));

describe("ProfilePhotoUpload", () => {
  const defaultProps = {
    userId: "user-123",
    currentAvatarUrl: null,
    onPhotoUpdated: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpload.mockResolvedValue({ data: { path: "user-123/profile.jpg" }, error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "https://example.com/avatar.jpg" } });
    mockUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    });
    mockRemove.mockResolvedValue({ data: null, error: null });
  });

  it("renders upload button when no avatar", () => {
    render(<ProfilePhotoUpload {...defaultProps} />);

    // There are two upload buttons - camera icon and text button
    expect(screen.getAllByRole("button", { name: /upload photo/i }).length).toBeGreaterThan(0);
    expect(screen.getByText(/JPG, PNG, or WebP. Max 5MB./i)).toBeInTheDocument();
  });

  it("renders default user icon when no avatar", () => {
    const { container } = render(<ProfilePhotoUpload {...defaultProps} />);

    // Should have User icon SVG
    const userIcon = container.querySelector("svg");
    expect(userIcon).toBeInTheDocument();
  });

  it("renders current avatar when provided", () => {
    render(
      <ProfilePhotoUpload
        {...defaultProps}
        currentAvatarUrl="https://example.com/existing-avatar.jpg"
      />
    );

    const img = screen.getByAltText("Profile photo");
    expect(img).toHaveAttribute("src");
  });

  it("renders remove button when avatar exists", () => {
    render(
      <ProfilePhotoUpload
        {...defaultProps}
        currentAvatarUrl="https://example.com/existing-avatar.jpg"
      />
    );

    expect(screen.getByRole("button", { name: /remove photo/i })).toBeInTheDocument();
  });

  it("has hidden file input", () => {
    const { container } = render(<ProfilePhotoUpload {...defaultProps} />);

    const input = container.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass("hidden");
  });

  it("accepts correct file types", () => {
    const { container } = render(<ProfilePhotoUpload {...defaultProps} />);

    const input = container.querySelector('input[type="file"]');
    expect(input).toHaveAttribute("accept", ".jpg,.jpeg,.png,.webp");
  });

  it("shows error for invalid file type", async () => {
    const { container } = render(<ProfilePhotoUpload {...defaultProps} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    const invalidFile = new File(["test"], "test.pdf", { type: "application/pdf" });
    Object.defineProperty(input, "files", { value: [invalidFile] });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/Please select a JPG, PNG, or WebP image/i)).toBeInTheDocument();
    });
  });

  it("shows error for oversized file", async () => {
    const { container } = render(<ProfilePhotoUpload {...defaultProps} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    // Create a mock file larger than 5MB
    const largeFile = new File(["x".repeat(6 * 1024 * 1024)], "large.jpg", { type: "image/jpeg" });
    Object.defineProperty(input, "files", { value: [largeFile] });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/Image must be less than 5MB/i)).toBeInTheDocument();
    });
  });

  it("shows preview and save button after selecting valid file", async () => {
    const { container } = render(<ProfilePhotoUpload {...defaultProps} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    const validFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(input, "files", { value: [validFile] });
    Object.defineProperty(validFile, "size", { value: 1024 }); // Small file

    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => "blob:test-url");

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save photo/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });
  });

  it("cancels preview when cancel button is clicked", async () => {
    const { container } = render(<ProfilePhotoUpload {...defaultProps} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    const validFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(input, "files", { value: [validFile] });
    Object.defineProperty(validFile, "size", { value: 1024 });

    global.URL.createObjectURL = jest.fn(() => "blob:test-url");
    global.URL.revokeObjectURL = jest.fn();

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() => {
      // After cancel, upload buttons should appear
      expect(screen.getAllByRole("button", { name: /upload photo/i }).length).toBeGreaterThan(0);
    });
  });

  it("calls onPhotoUpdated after successful upload", async () => {
    const onPhotoUpdated = jest.fn();
    const { container } = render(
      <ProfilePhotoUpload {...defaultProps} onPhotoUpdated={onPhotoUpdated} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    const validFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(input, "files", { value: [validFile] });
    Object.defineProperty(validFile, "size", { value: 1024 });

    global.URL.createObjectURL = jest.fn(() => "blob:test-url");

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save photo/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /save photo/i }));

    await waitFor(() => {
      expect(onPhotoUpdated).toHaveBeenCalled();
    });
  });

  it("shows success message after upload", async () => {
    const { container } = render(<ProfilePhotoUpload {...defaultProps} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    const validFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(input, "files", { value: [validFile] });
    Object.defineProperty(validFile, "size", { value: 1024 });

    global.URL.createObjectURL = jest.fn(() => "blob:test-url");

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save photo/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /save photo/i }));

    await waitFor(() => {
      expect(screen.getByText(/Photo uploaded successfully/i)).toBeInTheDocument();
    });
  });

  it("shows camera icon button", () => {
    render(<ProfilePhotoUpload {...defaultProps} />);

    // Camera button has aria-label "Upload photo"
    const cameraButtons = screen.getAllByRole("button", { name: /upload photo/i });
    expect(cameraButtons.length).toBeGreaterThan(0);
  });

  it("does nothing when file input change fires with no files", async () => {
    const { container } = render(<ProfilePhotoUpload {...defaultProps} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    // Fire change with no files selected
    Object.defineProperty(input, "files", { value: [] });
    fireEvent.change(input);

    // Should still be in idle state — upload buttons visible
    expect(screen.getAllByRole("button", { name: /upload photo/i }).length).toBeGreaterThan(0);
  });

  it("shows error when upload to Supabase Storage fails", async () => {
    mockUpload.mockResolvedValue({ data: null, error: { message: "Storage bucket full" } });

    const { container } = render(<ProfilePhotoUpload {...defaultProps} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = new File(["test"], "test.png", { type: "image/png" });
    Object.defineProperty(input, "files", { value: [validFile] });
    Object.defineProperty(validFile, "size", { value: 1024 });

    global.URL.createObjectURL = jest.fn(() => "blob:test-url");

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save photo/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /save photo/i }));

    await waitFor(() => {
      expect(screen.getByText(/Storage bucket full/i)).toBeInTheDocument();
    });
  });

  it("shows error when profile update fails after upload", async () => {
    mockUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: null, error: { message: "Profile update failed" } }),
    });

    const { container } = render(<ProfilePhotoUpload {...defaultProps} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(input, "files", { value: [validFile] });
    Object.defineProperty(validFile, "size", { value: 1024 });

    global.URL.createObjectURL = jest.fn(() => "blob:test-url");

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save photo/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /save photo/i }));

    await waitFor(() => {
      expect(screen.getByText(/Profile update failed/i)).toBeInTheDocument();
    });
  });

  it("shows generic error when upload throws a non-Error", async () => {
    mockUpload.mockRejectedValue("unknown error string");

    const { container } = render(<ProfilePhotoUpload {...defaultProps} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(input, "files", { value: [validFile] });
    Object.defineProperty(validFile, "size", { value: 1024 });

    global.URL.createObjectURL = jest.fn(() => "blob:test-url");

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save photo/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /save photo/i }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to upload photo/i)).toBeInTheDocument();
    });
  });

  describe("remove photo", () => {
    it("calls onPhotoUpdated after successful removal", async () => {
      const onPhotoUpdated = jest.fn();
      render(
        <ProfilePhotoUpload
          {...defaultProps}
          currentAvatarUrl="https://example.com/existing.jpg"
          onPhotoUpdated={onPhotoUpdated}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /remove photo/i }));

      await waitFor(() => {
        expect(onPhotoUpdated).toHaveBeenCalled();
      });
    });

    it("shows success message after removal", async () => {
      render(
        <ProfilePhotoUpload {...defaultProps} currentAvatarUrl="https://example.com/existing.jpg" />
      );

      fireEvent.click(screen.getByRole("button", { name: /remove photo/i }));

      await waitFor(() => {
        expect(screen.getByText(/Photo removed successfully/i)).toBeInTheDocument();
      });
    });

    it("shows error when profile update fails during removal", async () => {
      mockUpdate.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: { message: "DB error on remove" } }),
      });

      render(
        <ProfilePhotoUpload {...defaultProps} currentAvatarUrl="https://example.com/existing.jpg" />
      );

      fireEvent.click(screen.getByRole("button", { name: /remove photo/i }));

      await waitFor(() => {
        expect(screen.getByText(/DB error on remove/i)).toBeInTheDocument();
      });
    });

    it("shows generic error when removal throws a non-Error", async () => {
      mockUpdate.mockReturnValue({
        eq: jest.fn().mockRejectedValue("non-Error thrown"),
      });

      render(
        <ProfilePhotoUpload {...defaultProps} currentAvatarUrl="https://example.com/existing.jpg" />
      );

      fireEvent.click(screen.getByRole("button", { name: /remove photo/i }));

      await waitFor(() => {
        expect(screen.getByText(/Failed to remove photo/i)).toBeInTheDocument();
      });
    });
  });

  it("revokes object URL when cancel is clicked during preview", async () => {
    const { container } = render(<ProfilePhotoUpload {...defaultProps} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(input, "files", { value: [validFile] });
    Object.defineProperty(validFile, "size", { value: 1024 });

    const revokeObjectURL = jest.fn();
    global.URL.createObjectURL = jest.fn(() => "blob:preview-url");
    global.URL.revokeObjectURL = revokeObjectURL;

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview-url");
  });

  it("triggers file input when camera button is clicked", () => {
    const { container } = render(<ProfilePhotoUpload {...defaultProps} />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = jest.spyOn(fileInput, "click");

    // The camera icon button has aria-label "Upload photo"
    const cameraButton = screen.getByRole("button", { name: "Upload photo" });
    fireEvent.click(cameraButton);

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it("resets to idle after successful upload timeout", async () => {
    jest.useFakeTimers();

    const { container } = render(<ProfilePhotoUpload {...defaultProps} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(input, "files", { value: [validFile] });
    Object.defineProperty(validFile, "size", { value: 1024 });

    global.URL.createObjectURL = jest.fn(() => "blob:test-url");

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save photo/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /save photo/i }));

    await waitFor(() => {
      expect(screen.getByText(/Photo uploaded successfully/i)).toBeInTheDocument();
    });

    // Advance past the 3s timeout
    jest.advanceTimersByTime(3001);

    await waitFor(() => {
      // After timeout, success message should be gone and Upload Photo button visible
      expect(screen.queryByText(/Photo uploaded successfully/i)).not.toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /upload photo/i }).length).toBeGreaterThan(0);
    });

    jest.useRealTimers();
  });

  it("resets to idle after successful removal timeout", async () => {
    jest.useFakeTimers();

    render(
      <ProfilePhotoUpload {...defaultProps} currentAvatarUrl="https://example.com/existing.jpg" />
    );

    fireEvent.click(screen.getByRole("button", { name: /remove photo/i }));

    await waitFor(() => {
      expect(screen.getByText(/Photo removed successfully/i)).toBeInTheDocument();
    });

    // Advance past the 3s timeout
    jest.advanceTimersByTime(3001);

    await waitFor(() => {
      expect(screen.queryByText(/Photo removed successfully/i)).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it("extracts correct file extension for upload path", async () => {
    const { container } = render(<ProfilePhotoUpload {...defaultProps} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = new File(["test"], "photo.webp", { type: "image/webp" });
    Object.defineProperty(input, "files", { value: [validFile] });
    Object.defineProperty(validFile, "size", { value: 1024 });

    global.URL.createObjectURL = jest.fn(() => "blob:test-url");

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save photo/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /save photo/i }));

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith(
        "user-123/profile.webp",
        expect.any(File),
        expect.objectContaining({ cacheControl: "3600", upsert: true })
      );
    });
  });
});
