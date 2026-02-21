import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodaysTasks } from "../todays-tasks";
import type { DayProgress } from "@/hooks/use-gamification";

describe("TodaysTasks", () => {
  const mockOnSave = jest.fn().mockResolvedValue(true);

  const defaultProps = {
    currentDay: 5,
    todayProgress: null,
    onSave: mockOnSave,
    canEdit: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("renders the day indicator", () => {
    render(<TodaysTasks {...defaultProps} />);
    expect(screen.getByText("Day 5 - Daily Tasks")).toBeInTheDocument();
  });

  it("renders all five metric input fields", () => {
    render(<TodaysTasks {...defaultProps} />);
    expect(screen.getByLabelText("Steps")).toBeInTheDocument();
    expect(screen.getByLabelText("Water (L)")).toBeInTheDocument();
    expect(screen.getByLabelText("Floors")).toBeInTheDocument();
    expect(screen.getByLabelText("Protein (g)")).toBeInTheDocument();
    expect(screen.getByLabelText("Sleep (hours)")).toBeInTheDocument();
  });

  it("renders the Daily Reflection section", () => {
    render(<TodaysTasks {...defaultProps} />);
    expect(screen.getByText("Daily Reflection")).toBeInTheDocument();
    expect(screen.getByLabelText("How are you feeling today?")).toBeInTheDocument();
    expect(screen.getByLabelText("What will you focus on tomorrow?")).toBeInTheDocument();
  });

  it("renders the points display", () => {
    render(<TodaysTasks {...defaultProps} />);
    expect(screen.getByText("Today's Points")).toBeInTheDocument();
    expect(screen.getByText("/ 150")).toBeInTheDocument();
  });

  it("renders the Save button", () => {
    render(<TodaysTasks {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Save Today/i })).toBeInTheDocument();
  });

  it("renders point hints for each metric", () => {
    render(<TodaysTasks {...defaultProps} />);
    expect(screen.getByText("7k=15pts, 10k=30pts, 15k+=45pts")).toBeInTheDocument();
    expect(screen.getByText("3.0L+=15pts")).toBeInTheDocument();
    expect(screen.getByText("4=15pts, 14+=45pts")).toBeInTheDocument();
    expect(screen.getByText("70g+=15pts")).toBeInTheDocument();
    expect(screen.getByText("7h+=15pts")).toBeInTheDocument();
  });

  describe("handleInputChange", () => {
    it("updates numeric metric value when input changes", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<TodaysTasks {...defaultProps} />);

      const stepsInput = screen.getByLabelText("Steps");
      await user.clear(stepsInput);
      await user.type(stepsInput, "10000");

      // Points should update: 10k steps = 30 pts
      expect(screen.getByText("30 pts")).toBeInTheDocument();
    });

    it("updates text field (feeling) when input changes", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<TodaysTasks {...defaultProps} />);

      const feelingInput = screen.getByLabelText("How are you feeling today?");
      await user.type(feelingInput, "Energized");

      expect(feelingInput).toHaveValue("Energized");
    });

    it("updates text field (tomorrowFocus) when input changes", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<TodaysTasks {...defaultProps} />);

      const focusInput = screen.getByLabelText("What will you focus on tomorrow?");
      await user.type(focusInput, "More water");

      expect(focusInput).toHaveValue("More water");
    });

    it("handles non-numeric input by defaulting to 0", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<TodaysTasks {...defaultProps} />);

      const stepsInput = screen.getByLabelText("Steps");
      await user.clear(stepsInput);
      // Type a non-numeric value in a number input - the value stays empty
      // The component handles parseFloat("") || 0 = 0
      await user.type(stepsInput, "abc");

      // Steps points should remain 0
      const stepsPts = screen.getAllByText("0 pts");
      expect(stepsPts.length).toBeGreaterThan(0);
    });

    it("resets save state when modifying input after success", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<TodaysTasks {...defaultProps} />);

      // Save first
      const saveButton = screen.getByRole("button", { name: /Save Today/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText("Progress Saved!")).toBeInTheDocument();
      });

      // Now modify an input — should reset save state
      const stepsInput = screen.getByLabelText("Steps");
      await user.clear(stepsInput);
      await user.type(stepsInput, "5000");

      // Save state should go back to idle
      expect(screen.getByText(/Save Today/i)).toBeInTheDocument();
    });

    it("resets save state when modifying input after error", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockOnSave.mockResolvedValueOnce(false);
      render(<TodaysTasks {...defaultProps} />);

      // Save — will error
      const saveButton = screen.getByRole("button", { name: /Save Today/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Error/i)).toBeInTheDocument();
      });

      // Now modify an input — should reset save state
      const waterInput = screen.getByLabelText("Water (L)");
      await user.clear(waterInput);
      await user.type(waterInput, "3.5");

      expect(screen.getByText(/Save Today/i)).toBeInTheDocument();
    });
  });

  describe("points calculation in real-time", () => {
    it("calculates steps points for 7k steps (15 pts)", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<TodaysTasks {...defaultProps} />);

      const stepsInput = screen.getByLabelText("Steps");
      await user.clear(stepsInput);
      await user.type(stepsInput, "7000");

      expect(screen.getByText("15 pts")).toBeInTheDocument();
    });

    it("calculates steps points for 15k+ steps (45 pts)", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<TodaysTasks {...defaultProps} />);

      const stepsInput = screen.getByLabelText("Steps");
      await user.clear(stepsInput);
      await user.type(stepsInput, "16000");

      expect(screen.getByText("45 pts")).toBeInTheDocument();
    });

    it("calculates water points for 3L+ (15 pts)", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<TodaysTasks {...defaultProps} />);

      const waterInput = screen.getByLabelText("Water (L)");
      await user.clear(waterInput);
      await user.type(waterInput, "3.5");

      // Water 15 pts should appear
      const ptsBadges = screen.getAllByText("15 pts");
      expect(ptsBadges.length).toBeGreaterThan(0);
    });

    it("shows total points with check-in bonus", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<TodaysTasks {...defaultProps} />);

      const stepsInput = screen.getByLabelText("Steps");
      await user.clear(stepsInput);
      await user.type(stepsInput, "10000");

      // 30 pts (steps) + 15 (check-in bonus) = 45
      expect(screen.getByText("45")).toBeInTheDocument();
    });

    it("caps total points at MAX_DAILY_POINTS (150)", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<TodaysTasks {...defaultProps} />);

      // Max out all metrics
      await user.clear(screen.getByLabelText("Steps"));
      await user.type(screen.getByLabelText("Steps"), "15000"); // 45
      await user.clear(screen.getByLabelText("Water (L)"));
      await user.type(screen.getByLabelText("Water (L)"), "3.5"); // 15
      await user.clear(screen.getByLabelText("Floors"));
      await user.type(screen.getByLabelText("Floors"), "14"); // 45
      await user.clear(screen.getByLabelText("Protein (g)"));
      await user.type(screen.getByLabelText("Protein (g)"), "80"); // 15
      await user.clear(screen.getByLabelText("Sleep (hours)"));
      await user.type(screen.getByLabelText("Sleep (hours)"), "8"); // 15

      // Total: 135 metric + 15 bonus = 150 (capped at 150)
      expect(screen.getByText("150")).toBeInTheDocument();
    });
  });

  describe("handleSave", () => {
    it("calls onSave with current metrics and shows success state", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<TodaysTasks {...defaultProps} />);

      const saveButton = screen.getByRole("button", { name: /Save Today/i });
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          steps: 0,
          waterLiters: 0,
          floorsClimbed: 0,
          proteinGrams: 0,
          sleepHours: 0,
        })
      );

      await waitFor(() => {
        expect(screen.getByText("Progress Saved!")).toBeInTheDocument();
      });

      // After 3s the state should reset to idle
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(screen.getByText(/Save Today/i)).toBeInTheDocument();
    });

    it("shows error state when onSave returns false", async () => {
      mockOnSave.mockResolvedValueOnce(false);
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<TodaysTasks {...defaultProps} />);

      const saveButton = screen.getByRole("button", { name: /Save Today/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Error/i)).toBeInTheDocument();
      });

      // After 3s the state should reset
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(screen.getByText(/Save Today/i)).toBeInTheDocument();
    });

    it("shows error state when onSave throws", async () => {
      mockOnSave.mockRejectedValueOnce(new Error("Save failed"));
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<TodaysTasks {...defaultProps} />);

      const saveButton = screen.getByRole("button", { name: /Save Today/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Error/i)).toBeInTheDocument();
      });

      // After 3s the state should reset
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(screen.getByText(/Save Today/i)).toBeInTheDocument();
    });

    it("does not call onSave when canEdit is false because button is disabled", () => {
      render(<TodaysTasks {...defaultProps} canEdit={false} />);

      const saveButton = screen.getByRole("button", { name: /Save Today/i });
      // The button is disabled, so clicks won't fire
      expect(saveButton).toBeDisabled();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it("shows the Saving... text while save is in progress", async () => {
      // Make onSave hang to see the saving state
      mockOnSave.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(true), 5000))
      );
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<TodaysTasks {...defaultProps} />);

      const saveButton = screen.getByRole("button", { name: /Save Today/i });
      await user.click(saveButton);

      expect(screen.getByText("Saving...")).toBeInTheDocument();

      // Resolve the save
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });
    });
  });

  describe("canEdit=false", () => {
    it("disables all input fields when canEdit is false", () => {
      render(<TodaysTasks {...defaultProps} canEdit={false} />);

      expect(screen.getByLabelText("Steps")).toBeDisabled();
      expect(screen.getByLabelText("Water (L)")).toBeDisabled();
      expect(screen.getByLabelText("Floors")).toBeDisabled();
      expect(screen.getByLabelText("Protein (g)")).toBeDisabled();
      expect(screen.getByLabelText("Sleep (hours)")).toBeDisabled();
      expect(screen.getByLabelText("How are you feeling today?")).toBeDisabled();
      expect(screen.getByLabelText("What will you focus on tomorrow?")).toBeDisabled();
    });

    it("shows cannot edit message when canEdit is false", () => {
      render(<TodaysTasks {...defaultProps} canEdit={false} />);
      expect(
        screen.getByText("Previous day entries cannot be edited after midnight.")
      ).toBeInTheDocument();
    });

    it("disables the save button when canEdit is false", () => {
      render(<TodaysTasks {...defaultProps} canEdit={false} />);
      const saveButton = screen.getByRole("button", { name: /Save Today/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe("todayProgress initialization", () => {
    it("pre-populates inputs with existing progress data", () => {
      const todayProgress: DayProgress = {
        dayNumber: 5,
        loggedDate: "2026-02-20",
        hasData: true,
        pointsEarned: 75,
        metrics: {
          steps: 8000,
          waterLiters: 2.5,
          floorsClimbed: 6,
          proteinGrams: 90,
          sleepHours: 7.5,
          feeling: "Great",
          tomorrowFocus: "Drink more water",
        },
      };

      render(<TodaysTasks {...defaultProps} todayProgress={todayProgress} />);

      expect(screen.getByLabelText("Steps")).toHaveValue(8000);
      expect(screen.getByLabelText("Water (L)")).toHaveValue(2.5);
      expect(screen.getByLabelText("Floors")).toHaveValue(6);
      expect(screen.getByLabelText("Protein (g)")).toHaveValue(90);
      expect(screen.getByLabelText("Sleep (hours)")).toHaveValue(7.5);
      expect(screen.getByLabelText("How are you feeling today?")).toHaveValue("Great");
      expect(screen.getByLabelText("What will you focus on tomorrow?")).toHaveValue(
        "Drink more water"
      );
    });

    it("does not pre-populate when todayProgress has no data", () => {
      const todayProgress: DayProgress = {
        dayNumber: 5,
        loggedDate: "2026-02-20",
        hasData: false,
        pointsEarned: 0,
        metrics: {
          steps: 0,
          waterLiters: 0,
          floorsClimbed: 0,
          proteinGrams: 0,
          sleepHours: 0,
          feeling: "",
          tomorrowFocus: "",
        },
      };

      render(<TodaysTasks {...defaultProps} todayProgress={todayProgress} />);

      // Inputs should remain at defaults (0 / empty)
      expect(screen.getByLabelText("Steps")).toHaveValue(null);
    });
  });
});
