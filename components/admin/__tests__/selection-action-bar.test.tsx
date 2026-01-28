import { render, screen, fireEvent } from "@testing-library/react";
import { SelectionActionBar } from "../selection-action-bar";

describe("SelectionActionBar Component", () => {
  const defaultProps = {
    selectedCount: 3,
    onCancel: jest.fn(),
    onSendNotification: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders with selected count", () => {
      render(<SelectionActionBar {...defaultProps} />);
      expect(screen.getByTestId("selected-count")).toHaveTextContent("3 selected");
    });

    it("renders cancel button", () => {
      render(<SelectionActionBar {...defaultProps} />);
      expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
      expect(screen.getByTestId("cancel-button")).toHaveTextContent("Cancel");
    });

    it("renders send notification button", () => {
      render(<SelectionActionBar {...defaultProps} />);
      expect(screen.getByTestId("send-notification-button")).toBeInTheDocument();
      expect(screen.getByTestId("send-notification-button")).toHaveTextContent("Send Notification");
    });

    it("displays singular when one is selected", () => {
      render(<SelectionActionBar {...defaultProps} selectedCount={1} />);
      expect(screen.getByTestId("selected-count")).toHaveTextContent("1 selected");
    });

    it("displays zero when none are selected", () => {
      render(<SelectionActionBar {...defaultProps} selectedCount={0} />);
      expect(screen.getByTestId("selected-count")).toHaveTextContent("0 selected");
    });
  });

  describe("Button Interactions", () => {
    it("calls onCancel when cancel button is clicked", () => {
      const onCancel = jest.fn();
      render(<SelectionActionBar {...defaultProps} onCancel={onCancel} />);

      fireEvent.click(screen.getByTestId("cancel-button"));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("calls onSendNotification when send button is clicked", () => {
      const onSendNotification = jest.fn();
      render(<SelectionActionBar {...defaultProps} onSendNotification={onSendNotification} />);

      fireEvent.click(screen.getByTestId("send-notification-button"));

      expect(onSendNotification).toHaveBeenCalledTimes(1);
    });
  });

  describe("Button States", () => {
    it("disables send notification button when selected count is 0", () => {
      render(<SelectionActionBar {...defaultProps} selectedCount={0} />);

      const sendButton = screen.getByTestId("send-notification-button");
      expect(sendButton).toBeDisabled();
      expect(sendButton).toHaveClass("opacity-50");
      expect(sendButton).toHaveClass("cursor-not-allowed");
    });

    it("enables send notification button when selected count is greater than 0", () => {
      render(<SelectionActionBar {...defaultProps} selectedCount={5} />);

      const sendButton = screen.getByTestId("send-notification-button");
      expect(sendButton).not.toBeDisabled();
      expect(sendButton).not.toHaveClass("opacity-50");
    });

    it("cancel button is always enabled", () => {
      render(<SelectionActionBar {...defaultProps} selectedCount={0} />);

      const cancelButton = screen.getByTestId("cancel-button");
      expect(cancelButton).not.toBeDisabled();
    });
  });

  describe("Styling", () => {
    it("has fixed positioning at bottom center", () => {
      const { container } = render(<SelectionActionBar {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("fixed");
      expect(wrapper).toHaveClass("bottom-6");
      expect(wrapper).toHaveClass("left-1/2");
      expect(wrapper).toHaveClass("-translate-x-1/2");
    });

    it("has slide-in animation", () => {
      const { container } = render(<SelectionActionBar {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("animate-in");
      expect(wrapper).toHaveClass("slide-in-from-bottom-4");
    });

    it("uses athletic-card styling", () => {
      const { container } = render(<SelectionActionBar {...defaultProps} />);
      expect(container.querySelector(".athletic-card")).toBeInTheDocument();
    });
  });
});
