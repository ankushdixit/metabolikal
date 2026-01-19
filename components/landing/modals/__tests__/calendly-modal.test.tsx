import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendlyModal } from "../calendly-modal";

describe("CalendlyModal", () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the modal when open", () => {
    render(<CalendlyModal {...defaultProps} />);
    expect(screen.getByText("Book Your Strategy Call")).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    render(<CalendlyModal {...defaultProps} />);
    expect(screen.getByText("Let's engineer your metabolic transformation")).toBeInTheDocument();
  });

  it("renders the Calendly embed container", () => {
    render(<CalendlyModal {...defaultProps} />);
    const container = document.getElementById("calendly-embed");
    expect(container).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<CalendlyModal {...defaultProps} open={false} />);
    expect(screen.queryByText("Book Your Strategy Call")).not.toBeInTheDocument();
  });

  it("calls onOpenChange when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<CalendlyModal {...defaultProps} />);

    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("has correct modal structure with header", () => {
    render(<CalendlyModal {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
