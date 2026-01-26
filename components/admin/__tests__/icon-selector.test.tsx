import { render, screen, fireEvent } from "@testing-library/react";
import { IconSelector, RenderIcon, getIconComponent } from "../icon-selector";

describe("IconSelector Component", () => {
  it("renders paginated icons (first page)", () => {
    const mockOnChange = jest.fn();
    render(<IconSelector value={null} onChange={mockOnChange} />);

    // Should show icons grid with pagination (60 icons per page)
    const buttons = screen.getAllByRole("button");
    // Buttons include pagination controls (Previous/Next) when there are multiple pages
    expect(buttons.length).toBeGreaterThan(50);
  });

  it("displays search input", () => {
    const mockOnChange = jest.fn();
    render(<IconSelector value={null} onChange={mockOnChange} />);

    const searchInput = screen.getByPlaceholderText("Search 1500+ icons...");
    expect(searchInput).toBeInTheDocument();
  });

  it("filters icons when searching", () => {
    const mockOnChange = jest.fn();
    render(<IconSelector value={null} onChange={mockOnChange} />);

    const searchInput = screen.getByPlaceholderText("Search 1500+ icons...");
    fireEvent.change(searchInput, { target: { value: "heart" } });

    // Should show filtered results text
    expect(screen.getByText(/icon.*found/)).toBeInTheDocument();

    // Should find heart icon
    expect(screen.getByLabelText("heart")).toBeInTheDocument();
  });

  it("applies selected styling to active icon", () => {
    const mockOnChange = jest.fn();
    render(<IconSelector value="heart" onChange={mockOnChange} />);

    // Selected icon should be displayed in the selection display area
    expect(screen.getByText("heart")).toBeInTheDocument();
  });

  it("calls onChange with kebab-case value when icon is clicked", () => {
    const mockOnChange = jest.fn();
    render(<IconSelector value={null} onChange={mockOnChange} />);

    // Search for a specific icon
    const searchInput = screen.getByPlaceholderText("Search 1500+ icons...");
    fireEvent.change(searchInput, { target: { value: "sun" } });

    const sunButton = screen.getByLabelText("sun");
    fireEvent.click(sunButton);

    expect(mockOnChange).toHaveBeenCalledWith("sun");
  });

  it("shows no results message when search finds nothing", () => {
    const mockOnChange = jest.fn();
    render(<IconSelector value={null} onChange={mockOnChange} />);

    const searchInput = screen.getByPlaceholderText("Search 1500+ icons...");
    fireEvent.change(searchInput, { target: { value: "xyznotfound123" } });

    expect(screen.getByText("No icons match your search")).toBeInTheDocument();
  });

  it("displays selected icon info when value is set", () => {
    const mockOnChange = jest.fn();
    render(<IconSelector value="activity" onChange={mockOnChange} />);

    // Should show selected icon name
    expect(screen.getByText("activity")).toBeInTheDocument();
  });

  it("shows pagination controls when there are many icons", () => {
    const mockOnChange = jest.fn();
    render(<IconSelector value={null} onChange={mockOnChange} />);

    // Should show Previous and Next buttons for pagination
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("disables Previous button on first page", () => {
    const mockOnChange = jest.fn();
    render(<IconSelector value={null} onChange={mockOnChange} />);

    const prevButton = screen.getByText("Previous");
    expect(prevButton).toBeDisabled();
  });

  it("navigates to next page", () => {
    const mockOnChange = jest.fn();
    render(<IconSelector value={null} onChange={mockOnChange} />);

    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);

    // After clicking Next, Previous should be enabled
    const prevButton = screen.getByText("Previous");
    expect(prevButton).not.toBeDisabled();
  });

  it("accepts custom className", () => {
    const mockOnChange = jest.fn();
    const { container } = render(
      <IconSelector value={null} onChange={mockOnChange} className="custom-class" />
    );

    // The wrapper div should have the custom class
    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("getIconComponent function", () => {
  it("returns icon component for valid icon value", () => {
    const IconComponent = getIconComponent("footprints");
    expect(IconComponent).not.toBeNull();
  });

  it("returns icon component for kebab-case icon names", () => {
    const IconComponent = getIconComponent("book-open");
    expect(IconComponent).not.toBeNull();
  });

  it("returns null for null input", () => {
    const IconComponent = getIconComponent(null);
    expect(IconComponent).toBeNull();
  });

  it("returns null for undefined input", () => {
    const IconComponent = getIconComponent(undefined);
    expect(IconComponent).toBeNull();
  });

  it("returns null for invalid icon value", () => {
    const IconComponent = getIconComponent("totally-fake-icon-xyz");
    expect(IconComponent).toBeNull();
  });
});

describe("RenderIcon Component", () => {
  it("renders icon for valid icon value", () => {
    render(<RenderIcon icon="sun" className="test-class" />);

    // The SVG should be rendered
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("test-class");
  });

  it("renders nothing for null icon", () => {
    const { container } = render(<RenderIcon icon={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for undefined icon", () => {
    const { container } = render(<RenderIcon icon={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for invalid icon", () => {
    const { container } = render(<RenderIcon icon="totally-invalid-icon" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("applies className to rendered icon", () => {
    render(<RenderIcon icon="heart" className="h-10 w-10 text-red-500" />);

    const svg = document.querySelector("svg");
    expect(svg).toHaveClass("h-10");
    expect(svg).toHaveClass("w-10");
    expect(svg).toHaveClass("text-red-500");
  });

  it("renders kebab-case named icons", () => {
    render(<RenderIcon icon="book-open" className="test-class" />);

    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
