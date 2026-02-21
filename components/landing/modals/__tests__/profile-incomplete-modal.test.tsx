import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileIncompleteModal } from "../profile-incomplete-modal";

const defaultProps = {
  open: true,
  onOpenChange: jest.fn(),
  onStartAssessment: jest.fn(),
  onStartCalculator: jest.fn(),
  hasAssessment: false,
  hasCalculator: false,
};

describe("ProfileIncompleteModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders when open", () => {
    render(<ProfileIncompleteModal {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Locked/)).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<ProfileIncompleteModal {...defaultProps} open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  // ---- handleStartAction branches ----

  describe("handleStartAction", () => {
    it("calls onStartAssessment when hasAssessment is false", async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();
      const onStartAssessment = jest.fn();
      render(
        <ProfileIncompleteModal
          {...defaultProps}
          onOpenChange={onOpenChange}
          onStartAssessment={onStartAssessment}
          hasAssessment={false}
          hasCalculator={false}
        />
      );

      await user.click(screen.getByText("Start Assessment"));
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(onStartAssessment).toHaveBeenCalled();
    });

    it("calls onStartCalculator when hasAssessment is true but hasCalculator is false", async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();
      const onStartCalculator = jest.fn();
      const onStartAssessment = jest.fn();
      render(
        <ProfileIncompleteModal
          {...defaultProps}
          onOpenChange={onOpenChange}
          onStartAssessment={onStartAssessment}
          onStartCalculator={onStartCalculator}
          hasAssessment={true}
          hasCalculator={false}
        />
      );

      await user.click(screen.getByText("Continue to Calculator"));
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(onStartCalculator).toHaveBeenCalled();
      expect(onStartAssessment).not.toHaveBeenCalled();
    });

    it("calls neither when both are completed", async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();
      const onStartAssessment = jest.fn();
      const onStartCalculator = jest.fn();
      render(
        <ProfileIncompleteModal
          {...defaultProps}
          onOpenChange={onOpenChange}
          onStartAssessment={onStartAssessment}
          onStartCalculator={onStartCalculator}
          hasAssessment={true}
          hasCalculator={true}
        />
      );

      await user.click(screen.getByText("Open Challenge Hub"));
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(onStartAssessment).not.toHaveBeenCalled();
      expect(onStartCalculator).not.toHaveBeenCalled();
    });
  });

  // ---- getActionButtonText branches ----

  describe("getActionButtonText", () => {
    it("shows 'Start Assessment' when hasAssessment is false", () => {
      render(
        <ProfileIncompleteModal {...defaultProps} hasAssessment={false} hasCalculator={false} />
      );
      expect(screen.getByText("Start Assessment")).toBeInTheDocument();
    });

    it("shows 'Continue to Calculator' when hasAssessment is true but hasCalculator is false", () => {
      render(
        <ProfileIncompleteModal {...defaultProps} hasAssessment={true} hasCalculator={false} />
      );
      expect(screen.getByText("Continue to Calculator")).toBeInTheDocument();
    });

    it("shows 'Open Challenge Hub' when both are true", () => {
      render(
        <ProfileIncompleteModal {...defaultProps} hasAssessment={true} hasCalculator={true} />
      );
      expect(screen.getByText("Open Challenge Hub")).toBeInTheDocument();
    });
  });

  // ---- Conditional rendering for steps ----

  describe("step completion indicators", () => {
    it("shows incomplete indicators when both are false", () => {
      render(
        <ProfileIncompleteModal {...defaultProps} hasAssessment={false} hasCalculator={false} />
      );
      // Both steps should show incomplete text
      expect(
        screen.getByText("Rate your current lifestyle across 7 key areas")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Get your personalized BMR, TDEE, and protein target")
      ).toBeInTheDocument();
    });

    it("shows completed indicator for assessment when hasAssessment is true", () => {
      render(
        <ProfileIncompleteModal {...defaultProps} hasAssessment={true} hasCalculator={false} />
      );
      const completedTexts = screen.getAllByText("Completed");
      expect(completedTexts.length).toBe(1); // Only assessment is completed
    });

    it("shows completed indicator for calculator when hasCalculator is true", () => {
      render(
        <ProfileIncompleteModal {...defaultProps} hasAssessment={false} hasCalculator={true} />
      );
      const completedTexts = screen.getAllByText("Completed");
      expect(completedTexts.length).toBe(1); // Only calculator is completed
    });

    it("shows both completed when both are true", () => {
      render(
        <ProfileIncompleteModal {...defaultProps} hasAssessment={true} hasCalculator={true} />
      );
      const completedTexts = screen.getAllByText("Completed");
      expect(completedTexts.length).toBe(2);
    });
  });

  // ---- Close button ----

  describe("close button", () => {
    it("calls onOpenChange(false) when Close is clicked", async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();
      render(<ProfileIncompleteModal {...defaultProps} onOpenChange={onOpenChange} />);

      // There are two buttons named "Close" — the Dialog's X button and the actual Close button
      const closeButtons = screen.getAllByRole("button", { name: "Close" });
      // The explicit Close button has the btn-athletic class
      const explicitCloseBtn = closeButtons.find((btn) => btn.classList.contains("btn-athletic"));
      expect(explicitCloseBtn).toBeTruthy();
      await user.click(explicitCloseBtn!);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
