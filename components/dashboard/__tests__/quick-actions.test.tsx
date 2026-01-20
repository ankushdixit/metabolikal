import { render, screen, fireEvent } from "@testing-library/react";
import { QuickActions } from "../quick-actions";

describe("QuickActions Component", () => {
  const mockOnLogFood = jest.fn();

  beforeEach(() => {
    mockOnLogFood.mockClear();
  });

  it("renders Quick Actions header", () => {
    render(<QuickActions onLogFood={mockOnLogFood} />);
    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
  });

  it("renders Log Food button", () => {
    render(<QuickActions onLogFood={mockOnLogFood} />);
    expect(screen.getByText("Log Food")).toBeInTheDocument();
  });

  it("calls onLogFood when Log Food button is clicked", () => {
    render(<QuickActions onLogFood={mockOnLogFood} />);
    const logFoodButton = screen.getByText("Log Food");
    fireEvent.click(logFoodButton);
    expect(mockOnLogFood).toHaveBeenCalledTimes(1);
  });

  it("renders View Today's Meals link", () => {
    render(<QuickActions onLogFood={mockOnLogFood} />);
    expect(screen.getByText("View Today's Meals")).toBeInTheDocument();
  });

  it("renders View Today's Workout link", () => {
    render(<QuickActions onLogFood={mockOnLogFood} />);
    expect(screen.getByText("View Today's Workout")).toBeInTheDocument();
  });

  it("renders Submit Check-In link", () => {
    render(<QuickActions onLogFood={mockOnLogFood} />);
    expect(screen.getByText("Submit Check-In")).toBeInTheDocument();
  });

  it("has correct href for View Today's Meals", () => {
    render(<QuickActions onLogFood={mockOnLogFood} />);
    const mealsLink = screen.getByText("View Today's Meals").closest("a");
    expect(mealsLink).toHaveAttribute("href", "/dashboard/diet");
  });

  it("has correct href for View Today's Workout", () => {
    render(<QuickActions onLogFood={mockOnLogFood} />);
    const workoutLink = screen.getByText("View Today's Workout").closest("a");
    expect(workoutLink).toHaveAttribute("href", "/dashboard/workout");
  });

  it("has correct href for Submit Check-In", () => {
    render(<QuickActions onLogFood={mockOnLogFood} />);
    const checkinLink = screen.getByText("Submit Check-In").closest("a");
    expect(checkinLink).toHaveAttribute("href", "/dashboard/checkin");
  });

  it("renders description for each action", () => {
    render(<QuickActions onLogFood={mockOnLogFood} />);
    expect(screen.getByText("Check your meal plan")).toBeInTheDocument();
    expect(screen.getByText("See your exercises")).toBeInTheDocument();
    expect(screen.getByText("Log your progress")).toBeInTheDocument();
  });

  it("renders athletic card styling", () => {
    const { container } = render(<QuickActions onLogFood={mockOnLogFood} />);
    const card = container.querySelector(".athletic-card");
    expect(card).toBeInTheDocument();
  });

  it("renders Log Food button with gradient styling", () => {
    const { container } = render(<QuickActions onLogFood={mockOnLogFood} />);
    const gradientButton = container.querySelector(".gradient-electric");
    expect(gradientButton).toBeInTheDocument();
  });

  it("renders btn-athletic styling on all buttons", () => {
    const { container } = render(<QuickActions onLogFood={mockOnLogFood} />);
    const athleticButtons = container.querySelectorAll(".btn-athletic");
    expect(athleticButtons.length).toBe(4); // Log Food + 3 navigation buttons
  });

  it("renders gradient electric accent bar in header", () => {
    const { container } = render(<QuickActions onLogFood={mockOnLogFood} />);
    const accentBar = container.querySelector(".gradient-electric");
    expect(accentBar).toBeInTheDocument();
  });
});
