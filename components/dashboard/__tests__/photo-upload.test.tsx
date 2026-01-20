import { render, screen } from "@testing-library/react";
import { PhotoUpload } from "../photo-upload";

// Mock Supabase client
jest.mock("@/lib/auth", () => ({
  createBrowserSupabaseClient: () => ({
    storage: {
      from: () => ({
        upload: jest.fn().mockResolvedValue({ data: { path: "test/path.jpg" }, error: null }),
        createSignedUrl: jest
          .fn()
          .mockResolvedValue({ data: { signedUrl: "https://example.com/signed-url" } }),
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    },
  }),
}));

describe("PhotoUpload Component", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders upload placeholder when no value", () => {
    render(
      <PhotoUpload
        label="Front View"
        view="front"
        userId="user-123"
        value={null}
        onChange={mockOnChange}
      />
    );
    expect(screen.getByText("Front View")).toBeInTheDocument();
    expect(screen.getByText("Click to upload")).toBeInTheDocument();
    expect(screen.getByText("JPG, PNG, WebP (max 10MB)")).toBeInTheDocument();
  });

  it("renders label correctly", () => {
    render(
      <PhotoUpload
        label="Side View"
        view="side"
        userId="user-123"
        value={null}
        onChange={mockOnChange}
      />
    );
    expect(screen.getByText("Side View")).toBeInTheDocument();
  });

  it("has hidden file input", () => {
    const { container } = render(
      <PhotoUpload
        label="Front View"
        view="front"
        userId="user-123"
        value={null}
        onChange={mockOnChange}
      />
    );
    const input = container.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass("hidden");
  });

  it("accepts only image file types", () => {
    const { container } = render(
      <PhotoUpload
        label="Front View"
        view="front"
        userId="user-123"
        value={null}
        onChange={mockOnChange}
      />
    );
    const input = container.querySelector('input[type="file"]');
    expect(input).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
  });

  it("disables interaction when disabled prop is true", () => {
    const { container } = render(
      <PhotoUpload
        label="Front View"
        view="front"
        userId="user-123"
        value={null}
        onChange={mockOnChange}
        disabled
      />
    );
    const uploadArea = container.querySelector('[class*="cursor-not-allowed"]');
    expect(uploadArea).toBeInTheDocument();
  });

  it("shows remove button when value is present", () => {
    render(
      <PhotoUpload
        label="Front View"
        view="front"
        userId="user-123"
        value="test/photo.jpg"
        onChange={mockOnChange}
      />
    );
    const removeButton = screen.getByRole("button", { name: /remove photo/i });
    expect(removeButton).toBeInTheDocument();
  });

  it("renders with aspect ratio 3:4", () => {
    const { container } = render(
      <PhotoUpload
        label="Front View"
        view="front"
        userId="user-123"
        value={null}
        onChange={mockOnChange}
      />
    );
    const uploadArea = container.querySelector('[class*="aspect-[3/4]"]');
    expect(uploadArea).toBeInTheDocument();
  });

  it("applies border styling when value exists", () => {
    const { container } = render(
      <PhotoUpload
        label="Front View"
        view="front"
        userId="user-123"
        value="test/photo.jpg"
        onChange={mockOnChange}
      />
    );
    const uploadArea = container.querySelector('[class*="border-primary"]');
    expect(uploadArea).toBeInTheDocument();
  });
});
