import { render, screen, fireEvent } from "@testing-library/react";
import { CSVUpload } from "../csv-upload";

describe("CSVUpload", () => {
  const mockOnFileSelect = jest.fn();
  const mockOnClear = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders upload area when no file selected", () => {
    render(<CSVUpload onFileSelect={mockOnFileSelect} onClear={mockOnClear} selectedFile={null} />);

    expect(screen.getByText(/drag and drop csv file here/i)).toBeInTheDocument();
    expect(screen.getByText(/or click to browse/i)).toBeInTheDocument();
  });

  it("shows file info when file is selected", () => {
    const mockFile = new File(["test"], "test.csv", { type: "text/csv" });
    Object.defineProperty(mockFile, "size", { value: 1024 });

    render(
      <CSVUpload onFileSelect={mockOnFileSelect} onClear={mockOnClear} selectedFile={mockFile} />
    );

    expect(screen.getByText("test.csv")).toBeInTheDocument();
    expect(screen.getByText("1.0 KB")).toBeInTheDocument();
    expect(screen.getByText("Remove")).toBeInTheDocument();
  });

  it("calls onClear when remove button is clicked", () => {
    const mockFile = new File(["test"], "test.csv", { type: "text/csv" });

    render(
      <CSVUpload onFileSelect={mockOnFileSelect} onClear={mockOnClear} selectedFile={mockFile} />
    );

    const removeButton = screen.getByText("Remove");
    fireEvent.click(removeButton);

    expect(mockOnClear).toHaveBeenCalledTimes(1);
  });

  it("displays error message when error prop is set", () => {
    render(
      <CSVUpload
        onFileSelect={mockOnFileSelect}
        onClear={mockOnClear}
        selectedFile={null}
        error="Invalid file format"
      />
    );

    expect(screen.getByText("Invalid file format")).toBeInTheDocument();
  });

  it("shows processing state", () => {
    const mockFile = new File(["test"], "test.csv", { type: "text/csv" });

    render(
      <CSVUpload
        onFileSelect={mockOnFileSelect}
        onClear={mockOnClear}
        selectedFile={mockFile}
        isProcessing={true}
      />
    );

    // Remove button should not be visible during processing
    expect(screen.queryByText("Remove")).not.toBeInTheDocument();
  });

  it("handles drag over state", () => {
    const { container } = render(
      <CSVUpload onFileSelect={mockOnFileSelect} onClear={mockOnClear} selectedFile={null} />
    );

    const dropZone = container.querySelector("div.border-dashed");
    expect(dropZone).toBeInTheDocument();

    fireEvent.dragOver(dropZone!);
    expect(screen.getByText(/drop your csv file here/i)).toBeInTheDocument();

    fireEvent.dragLeave(dropZone!);
    expect(screen.getByText(/drag and drop csv file here/i)).toBeInTheDocument();
  });

  it("calls onFileSelect when file is dropped", () => {
    const { container } = render(
      <CSVUpload onFileSelect={mockOnFileSelect} onClear={mockOnClear} selectedFile={null} />
    );

    const dropZone = container.querySelector("div.border-dashed");
    const mockFile = new File(["test"], "test.csv", { type: "text/csv" });

    const dropEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: {
        files: [mockFile],
      },
    };

    fireEvent.drop(dropZone!, dropEvent);

    expect(mockOnFileSelect).toHaveBeenCalledWith(mockFile);
  });
});
