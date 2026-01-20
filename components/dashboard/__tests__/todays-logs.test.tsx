import { render, screen, fireEvent } from "@testing-library/react";
import { TodaysLogs } from "../todays-logs";

const mockLogs = [
  {
    id: "log-1",
    food_name: null,
    food_item_id: "food-1",
    calories: 300,
    protein: 35,
    logged_at: "2026-01-20T08:30:00Z",
    meal_category: "breakfast",
    food_items: {
      name: "Grilled Chicken",
    },
  },
  {
    id: "log-2",
    food_name: "Custom Salad",
    food_item_id: null,
    calories: 150,
    protein: 10,
    logged_at: "2026-01-20T12:00:00Z",
    meal_category: "lunch",
    food_items: null,
  },
  {
    id: "log-3",
    food_name: null,
    food_item_id: "food-2",
    calories: 200,
    protein: 20,
    logged_at: "2026-01-20T18:30:00Z",
    meal_category: "dinner",
    food_items: {
      name: "Salmon",
    },
  },
];

describe("TodaysLogs Component", () => {
  const mockOnDeleteLog = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders empty state when no logs", () => {
    render(<TodaysLogs logs={[]} onDeleteLog={mockOnDeleteLog} />);
    expect(
      screen.getByText("No food logged yet today. Start logging your meals!")
    ).toBeInTheDocument();
  });

  it("renders header title", () => {
    render(<TodaysLogs logs={mockLogs} onDeleteLog={mockOnDeleteLog} />);
    expect(screen.getByText("Today's Logged Items")).toBeInTheDocument();
  });

  it("displays log entry count", () => {
    render(<TodaysLogs logs={mockLogs} onDeleteLog={mockOnDeleteLog} />);
    expect(screen.getByText("3 entries")).toBeInTheDocument();
  });

  it("shows singular entry text for one log", () => {
    render(<TodaysLogs logs={[mockLogs[0]]} onDeleteLog={mockOnDeleteLog} />);
    expect(screen.getByText("1 entry")).toBeInTheDocument();
  });

  it("displays food names from food_items relation", () => {
    render(<TodaysLogs logs={mockLogs} onDeleteLog={mockOnDeleteLog} />);
    expect(screen.getByText("Grilled Chicken")).toBeInTheDocument();
    expect(screen.getByText("Salmon")).toBeInTheDocument();
  });

  it("displays food_name for custom entries", () => {
    render(<TodaysLogs logs={mockLogs} onDeleteLog={mockOnDeleteLog} />);
    expect(screen.getByText("Custom Salad")).toBeInTheDocument();
  });

  it("displays calories for each log", () => {
    render(<TodaysLogs logs={mockLogs} onDeleteLog={mockOnDeleteLog} />);
    expect(screen.getByText("300 kcal")).toBeInTheDocument();
    expect(screen.getByText("150 kcal")).toBeInTheDocument();
    expect(screen.getByText("200 kcal")).toBeInTheDocument();
  });

  it("displays protein for each log", () => {
    render(<TodaysLogs logs={mockLogs} onDeleteLog={mockOnDeleteLog} />);
    expect(screen.getByText("35g protein")).toBeInTheDocument();
    expect(screen.getByText("10g protein")).toBeInTheDocument();
    expect(screen.getByText("20g protein")).toBeInTheDocument();
  });

  it("displays total calories summary", () => {
    render(<TodaysLogs logs={mockLogs} onDeleteLog={mockOnDeleteLog} />);
    // 300 + 150 + 200 = 650
    expect(screen.getByText("650")).toBeInTheDocument();
    expect(screen.getByText("kcal total")).toBeInTheDocument();
  });

  it("displays total protein summary", () => {
    render(<TodaysLogs logs={mockLogs} onDeleteLog={mockOnDeleteLog} />);
    // 35 + 10 + 20 = 65
    expect(screen.getByText("65")).toBeInTheDocument();
    expect(screen.getByText("g protein total")).toBeInTheDocument();
  });

  it("has delete button for each log entry", () => {
    render(<TodaysLogs logs={mockLogs} onDeleteLog={mockOnDeleteLog} />);
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    expect(deleteButtons).toHaveLength(3);
  });

  it("opens confirmation dialog when delete is clicked", () => {
    render(<TodaysLogs logs={mockLogs} onDeleteLog={mockOnDeleteLog} />);

    const deleteButton = screen.getByRole("button", { name: "Delete Grilled Chicken" });
    fireEvent.click(deleteButton);

    expect(screen.getByText("Delete Log Entry?")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This will remove this food from your daily log. This action cannot be undone."
      )
    ).toBeInTheDocument();
  });

  it("shows Cancel button in confirmation dialog", () => {
    render(<TodaysLogs logs={mockLogs} onDeleteLog={mockOnDeleteLog} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete Grilled Chicken" }));

    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("closes dialog when Cancel is clicked", () => {
    render(<TodaysLogs logs={mockLogs} onDeleteLog={mockOnDeleteLog} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete Grilled Chicken" }));
    fireEvent.click(screen.getByText("Cancel"));

    expect(screen.queryByText("Delete Log Entry?")).not.toBeInTheDocument();
  });

  it("calls onDeleteLog when delete is confirmed", () => {
    render(<TodaysLogs logs={mockLogs} onDeleteLog={mockOnDeleteLog} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete Grilled Chicken" }));
    fireEvent.click(screen.getByText("Delete"));

    expect(mockOnDeleteLog).toHaveBeenCalledWith("log-1");
  });

  it("shows Deleting... when isDeleting is true", () => {
    render(<TodaysLogs logs={mockLogs} onDeleteLog={mockOnDeleteLog} isDeleting={true} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete Grilled Chicken" }));

    expect(screen.getByText("Deleting...")).toBeInTheDocument();
  });

  it("disables delete button when isDeleting is true", () => {
    render(<TodaysLogs logs={mockLogs} onDeleteLog={mockOnDeleteLog} isDeleting={true} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete Grilled Chicken" }));

    const deleteButton = screen.getByText("Deleting...").closest("button");
    expect(deleteButton).toBeDisabled();
  });

  it("renders athletic card styling", () => {
    const { container } = render(<TodaysLogs logs={mockLogs} onDeleteLog={mockOnDeleteLog} />);
    const card = container.querySelector(".athletic-card");
    expect(card).toBeInTheDocument();
  });

  it("renders gradient-electric accent", () => {
    const { container } = render(<TodaysLogs logs={mockLogs} onDeleteLog={mockOnDeleteLog} />);
    const accent = container.querySelector(".gradient-electric");
    expect(accent).toBeInTheDocument();
  });

  it("displays Unknown Food when neither food_items nor food_name available", () => {
    const logWithNoName = [
      {
        id: "log-x",
        food_name: null,
        food_item_id: null,
        calories: 100,
        protein: 5,
        logged_at: "2026-01-20T10:00:00Z",
        meal_category: "snack",
        food_items: null,
      },
    ];
    render(<TodaysLogs logs={logWithNoName} onDeleteLog={mockOnDeleteLog} />);
    expect(screen.getByText("Unknown Food")).toBeInTheDocument();
  });
});
