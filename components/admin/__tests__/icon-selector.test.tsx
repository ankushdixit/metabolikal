import { render, screen, fireEvent } from "@testing-library/react";
import { IconSelector, RenderIcon, getIconComponent } from "../icon-selector";
import { LIFESTYLE_ACTIVITY_ICONS } from "@/lib/validations";

describe("IconSelector Component", () => {
  it("renders all available icons", () => {
    const mockOnChange = jest.fn();
    render(<IconSelector value={null} onChange={mockOnChange} />);

    // Check that all icons are rendered as buttons
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(LIFESTYLE_ACTIVITY_ICONS.length);
  });

  it("applies selected styling to active icon", () => {
    const mockOnChange = jest.fn();
    render(<IconSelector value="footprints" onChange={mockOnChange} />);

    const footprintsButton = screen.getByLabelText("Footprints");
    expect(footprintsButton).toHaveClass("gradient-electric");
  });

  it("applies default styling to non-selected icons", () => {
    const mockOnChange = jest.fn();
    render(<IconSelector value="footprints" onChange={mockOnChange} />);

    const sunButton = screen.getByLabelText("Sun");
    expect(sunButton).toHaveClass("bg-secondary");
  });

  it("calls onChange when icon is clicked", () => {
    const mockOnChange = jest.fn();
    render(<IconSelector value={null} onChange={mockOnChange} />);

    const sunButton = screen.getByLabelText("Sun");
    fireEvent.click(sunButton);

    expect(mockOnChange).toHaveBeenCalledWith("sun");
  });

  it("renders all expected icon options", () => {
    const mockOnChange = jest.fn();
    render(<IconSelector value={null} onChange={mockOnChange} />);

    expect(screen.getByLabelText("Footprints")).toBeInTheDocument();
    expect(screen.getByLabelText("Sun")).toBeInTheDocument();
    expect(screen.getByLabelText("Book")).toBeInTheDocument();
    expect(screen.getByLabelText("Water Drop")).toBeInTheDocument();
    expect(screen.getByLabelText("Moon")).toBeInTheDocument();
    expect(screen.getByLabelText("Users")).toBeInTheDocument();
    expect(screen.getByLabelText("Heart")).toBeInTheDocument();
    expect(screen.getByLabelText("Energy")).toBeInTheDocument();
    expect(screen.getByLabelText("Dumbbell")).toBeInTheDocument();
    expect(screen.getByLabelText("Leaf")).toBeInTheDocument();
    expect(screen.getByLabelText("Brain")).toBeInTheDocument();
    expect(screen.getByLabelText("Clock")).toBeInTheDocument();
  });

  it("changes selection when different icon clicked", () => {
    const mockOnChange = jest.fn();
    const { rerender } = render(<IconSelector value="footprints" onChange={mockOnChange} />);

    // Click moon button
    fireEvent.click(screen.getByLabelText("Moon"));
    expect(mockOnChange).toHaveBeenCalledWith("moon");

    // Rerender with new value to verify visual update
    rerender(<IconSelector value="moon" onChange={mockOnChange} />);
    expect(screen.getByLabelText("Moon")).toHaveClass("gradient-electric");
    expect(screen.getByLabelText("Footprints")).toHaveClass("bg-secondary");
  });

  it("accepts custom className", () => {
    const mockOnChange = jest.fn();
    render(<IconSelector value={null} onChange={mockOnChange} className="custom-class" />);

    // The wrapper div should have the custom class
    const wrapper = screen.getAllByRole("button")[0].parentElement;
    expect(wrapper).toHaveClass("custom-class");
  });
});

describe("getIconComponent function", () => {
  it("returns icon component for valid icon value", () => {
    const IconComponent = getIconComponent("footprints");
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
    const IconComponent = getIconComponent("invalid-icon");
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
    const { container } = render(<RenderIcon icon="invalid-icon" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("applies className to rendered icon", () => {
    render(<RenderIcon icon="heart" className="h-10 w-10 text-red-500" />);

    const svg = document.querySelector("svg");
    expect(svg).toHaveClass("h-10");
    expect(svg).toHaveClass("w-10");
    expect(svg).toHaveClass("text-red-500");
  });
});
