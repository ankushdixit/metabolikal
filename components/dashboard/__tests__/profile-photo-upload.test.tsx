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
});
