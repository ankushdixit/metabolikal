import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginRequiredModal } from "../login-required-modal";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
  })),
}));

describe("LoginRequiredModal", () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the modal when open", () => {
    render(<LoginRequiredModal {...defaultProps} />);
    expect(screen.getByText("Login Required")).toBeInTheDocument();
  });

  it("renders the description text", () => {
    render(<LoginRequiredModal {...defaultProps} />);
    expect(
      screen.getByText(/Sign in or create an account to access the 30-Day Metaboli-k-al Challenge/)
    ).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<LoginRequiredModal {...defaultProps} open={false} />);
    expect(screen.queryByText("Login Required")).not.toBeInTheDocument();
  });

  it("renders the Why Sign In section with benefits", () => {
    render(<LoginRequiredModal {...defaultProps} />);
    expect(screen.getByText("Why Sign In?")).toBeInTheDocument();
    expect(screen.getByText("Save your progress across all devices")).toBeInTheDocument();
    expect(
      screen.getByText("Get personalized protein targets based on your calculator results")
    ).toBeInTheDocument();
    expect(screen.getByText("Track your 30-day challenge journey")).toBeInTheDocument();
    expect(screen.getByText("Earn and keep points for completing daily tasks")).toBeInTheDocument();
  });

  it("navigates to login page and closes modal when Sign In is clicked", async () => {
    const user = userEvent.setup();
    render(<LoginRequiredModal {...defaultProps} />);

    const signInButton = screen.getByRole("button", { name: /Sign In/i });
    await user.click(signInButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    expect(mockPush).toHaveBeenCalledWith("/login?redirect=/&action=challenge-hub");
  });

  it("navigates to register page and closes modal when Create Free Account is clicked", async () => {
    const user = userEvent.setup();
    render(<LoginRequiredModal {...defaultProps} />);

    const registerButton = screen.getByRole("button", { name: /Create Free Account/i });
    await user.click(registerButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    expect(mockPush).toHaveBeenCalledWith("/register?redirect=/&action=challenge-hub");
  });

  it("closes modal when Maybe Later is clicked", async () => {
    const user = userEvent.setup();
    render(<LoginRequiredModal {...defaultProps} />);

    const maybeLaterButton = screen.getByRole("button", { name: /Maybe Later/i });
    await user.click(maybeLaterButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange when dialog close button is clicked", async () => {
    const user = userEvent.setup();
    render(<LoginRequiredModal {...defaultProps} />);

    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });
});
