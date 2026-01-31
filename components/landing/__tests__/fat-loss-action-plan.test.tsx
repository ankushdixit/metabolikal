import { render, screen } from "@testing-library/react";
import { FatLossActionPlan } from "../fat-loss-action-plan";

describe("FatLossActionPlan", () => {
  const defaultProps = {
    targetCalories: 1950,
    lifestyleScore: 70,
    physicalScore: 80,
    weightKg: 85,
    nutritionDeficit: 550,
  };

  describe("Smart Nutrition and Strategic Movement cards", () => {
    it("renders Smart Nutrition card with nutrition deficit", () => {
      render(<FatLossActionPlan {...defaultProps} />);

      expect(screen.getByText("Smart Nutrition")).toBeInTheDocument();
      expect(screen.getByText("550")).toBeInTheDocument();
      expect(screen.getByText("calories below maintenance")).toBeInTheDocument();
    });

    it("renders Strategic Movement card with calculated movement deficit", () => {
      render(<FatLossActionPlan {...defaultProps} />);

      expect(screen.getByText("Strategic Movement")).toBeInTheDocument();
      // avgScore = (70 + 80) / 2 = 75
      // movementDeficit = 375 + (75/100) * 225 = 375 + 168.75 = 544 (rounded)
      expect(screen.getByText("544")).toBeInTheDocument();
      expect(screen.getByText("calories through activity")).toBeInTheDocument();
    });

    it("renders target calories in nutrition card", () => {
      render(<FatLossActionPlan {...defaultProps} />);

      expect(screen.getByText(/1,950 cal\/day/)).toBeInTheDocument();
    });

    it("renders workout plan in movement card", () => {
      render(<FatLossActionPlan {...defaultProps} />);

      expect(screen.getByText("4-5 workouts + daily movement")).toBeInTheDocument();
    });
  });

  describe("Combined Weekly Result Banner", () => {
    it("renders section header", () => {
      render(<FatLossActionPlan {...defaultProps} />);

      expect(screen.getByText("Combined Weekly Result")).toBeInTheDocument();
    });

    it("calculates weekly fat loss correctly", () => {
      render(<FatLossActionPlan {...defaultProps} />);

      // nutritionDeficit = 550
      // movementDeficit = 544 (from above calculation)
      // totalDailyDeficit = 1094
      // weeklyDeficit = 1094 * 7 = 7658
      // weeklyFatLossKg = 7658 / 7700 = 0.99... ≈ 1.0
      expect(screen.getByText("1.0 kg")).toBeInTheDocument();
      expect(screen.getByText("potential fat loss per week")).toBeInTheDocument();
    });

    it("shows calculation breakdown", () => {
      render(<FatLossActionPlan {...defaultProps} />);

      // Shows the formula breakdown
      expect(screen.getByText(/550 \+ 544/)).toBeInTheDocument();
      expect(screen.getByText(/7,700 cal\/kg/)).toBeInTheDocument();
    });
  });

  describe("Timeline to Goal Section", () => {
    it("renders when goalWeightKg is provided and less than weightKg", () => {
      render(<FatLossActionPlan {...defaultProps} goalWeightKg={80} />);

      expect(screen.getByText("Timeline to Goal")).toBeInTheDocument();
      expect(screen.getByText("Current")).toBeInTheDocument();
      expect(screen.getByText("85")).toBeInTheDocument();
      expect(screen.getByText("Goal")).toBeInTheDocument();
      expect(screen.getByText("80")).toBeInTheDocument();
      expect(screen.getByText("To Lose")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("does not render when goalWeightKg is not provided", () => {
      render(<FatLossActionPlan {...defaultProps} />);

      expect(screen.queryByText("Timeline to Goal")).not.toBeInTheDocument();
    });

    it("does not render when goalWeightKg is greater than weightKg", () => {
      render(<FatLossActionPlan {...defaultProps} goalWeightKg={90} />);

      expect(screen.queryByText("Timeline to Goal")).not.toBeInTheDocument();
    });

    it("calculates weeks to goal correctly", () => {
      render(<FatLossActionPlan {...defaultProps} goalWeightKg={80} />);

      // weightToLose = 85 - 80 = 5 kg
      // weeklyFatLossKg = 1.0 kg
      // weeksToGoal = Math.ceil(5 / 1.0) = 5
      expect(screen.getByText("5 weeks")).toBeInTheDocument();
      expect(screen.getByText("Estimated Timeline")).toBeInTheDocument();
    });

    it("shows sustainable rate message", () => {
      render(<FatLossActionPlan {...defaultProps} goalWeightKg={80} />);

      expect(screen.getByText(/sustainable fat loss per week/)).toBeInTheDocument();
    });
  });

  describe("movement deficit calculation edge cases", () => {
    it("calculates minimum movement deficit with scores of 0", () => {
      render(<FatLossActionPlan {...defaultProps} lifestyleScore={0} physicalScore={0} />);

      // avgScore = 0
      // movementDeficit = 375 + (0/100) * 225 = 375
      expect(screen.getByText("375")).toBeInTheDocument();
    });

    it("calculates maximum movement deficit with scores of 100", () => {
      render(<FatLossActionPlan {...defaultProps} lifestyleScore={100} physicalScore={100} />);

      // avgScore = 100
      // movementDeficit = 375 + (100/100) * 225 = 600
      expect(screen.getByText("600")).toBeInTheDocument();
    });
  });
});
