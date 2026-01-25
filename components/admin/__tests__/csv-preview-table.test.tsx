import { render, screen, fireEvent } from "@testing-library/react";
import { CSVPreviewTable } from "../csv-preview-table";
import type { ValidatedCSVRow } from "@/lib/csv-parser";

describe("CSVPreviewTable", () => {
  const validRow: ValidatedCSVRow = {
    rowNumber: 2,
    data: {
      name: "Chicken Breast",
      calories: "165",
      protein: "31",
      serving_size: "100g",
      is_vegetarian: "false",
    },
    errors: [],
    isValid: true,
  };

  const invalidRow: ValidatedCSVRow = {
    rowNumber: 3,
    data: {
      name: "",
      calories: "abc",
      protein: "10",
      serving_size: "100g",
    },
    errors: [
      { field: "name", message: "Name is required" },
      { field: "calories", message: "Calories must be a number" },
    ],
    isValid: false,
  };

  it("renders empty state when no rows", () => {
    render(<CSVPreviewTable rows={[]} />);

    expect(screen.getByText("No data to preview")).toBeInTheDocument();
  });

  it("renders table with valid rows", () => {
    render(<CSVPreviewTable rows={[validRow]} />);

    expect(screen.getByText("Chicken Breast")).toBeInTheDocument();
    expect(screen.getByText("165")).toBeInTheDocument();
    expect(screen.getByText("31g")).toBeInTheDocument();
    expect(screen.getByText("100g")).toBeInTheDocument();
    expect(screen.getByText("Valid")).toBeInTheDocument();
  });

  it("renders table with invalid rows", () => {
    render(<CSVPreviewTable rows={[invalidRow]} />);

    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Calories must be a number")).toBeInTheDocument();
  });

  it("shows row numbers", () => {
    render(<CSVPreviewTable rows={[validRow, invalidRow]} />);

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("filters to show only errors when showOnlyErrors is true", () => {
    render(<CSVPreviewTable rows={[validRow, invalidRow]} showOnlyErrors={true} />);

    // Should not show valid row
    expect(screen.queryByText("Chicken Breast")).not.toBeInTheDocument();
    // Should show invalid row
    expect(screen.getByText("Name is required")).toBeInTheDocument();
  });

  it("shows 'No rows with errors' when filtering with no invalid rows", () => {
    render(<CSVPreviewTable rows={[validRow]} showOnlyErrors={true} />);

    expect(screen.getByText("No rows with errors")).toBeInTheDocument();
  });

  it("paginates when more than 10 rows", () => {
    const rows: ValidatedCSVRow[] = Array.from({ length: 15 }, (_, i) => ({
      rowNumber: i + 2,
      data: {
        name: `Food ${i + 1}`,
        calories: "100",
        protein: "10",
        serving_size: "100g",
      },
      errors: [],
      isValid: true,
    }));

    render(<CSVPreviewTable rows={rows} />);

    // Should show pagination
    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();

    // First 10 items should be visible
    expect(screen.getByText("Food 1")).toBeInTheDocument();
    expect(screen.getByText("Food 10")).toBeInTheDocument();

    // Item 11 should not be visible
    expect(screen.queryByText("Food 11")).not.toBeInTheDocument();

    // Click next page
    const nextButton = screen.getByLabelText("Next page");
    fireEvent.click(nextButton);

    // Now page 2 should be visible
    expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument();
    expect(screen.getByText("Food 11")).toBeInTheDocument();
  });

  it("highlights error fields", () => {
    const { container } = render(<CSVPreviewTable rows={[invalidRow]} />);

    // The name field should have error styling
    const nameCells = container.querySelectorAll("td");
    const nameCell = Array.from(nameCells).find((cell) => cell.textContent === "Empty");
    expect(nameCell?.classList.contains("text-red-500")).toBe(true);
  });

  it("shows vegetarian status correctly", () => {
    const vegRow: ValidatedCSVRow = {
      ...validRow,
      data: { ...validRow.data, is_vegetarian: "true" },
    };

    const { rerender } = render(<CSVPreviewTable rows={[validRow]} />);
    expect(screen.getByText("No")).toBeInTheDocument();

    rerender(<CSVPreviewTable rows={[vegRow]} />);
    expect(screen.getByText("Yes")).toBeInTheDocument();
  });
});
