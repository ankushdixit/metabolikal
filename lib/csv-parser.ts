import Papa from "papaparse";
import type { FoodItemInsert } from "@/lib/database.types";

/**
 * CSV column headers for food item import
 */
export const CSV_HEADERS = [
  "name",
  "calories",
  "protein",
  "carbs",
  "fats",
  "serving_size",
  "is_vegetarian",
  "raw_quantity",
  "cooked_quantity",
  "meal_types",
] as const;

export type CSVHeader = (typeof CSV_HEADERS)[number];

/**
 * Raw CSV row before validation
 */
export interface RawCSVRow {
  name?: string;
  calories?: string;
  protein?: string;
  carbs?: string;
  fats?: string;
  serving_size?: string;
  is_vegetarian?: string;
  raw_quantity?: string;
  cooked_quantity?: string;
  meal_types?: string;
}

/**
 * Validation error for a CSV row
 */
export interface CSVValidationError {
  field: string;
  message: string;
}

/**
 * Validated CSV row with row number and error information
 */
export interface ValidatedCSVRow {
  rowNumber: number;
  data: RawCSVRow;
  errors: CSVValidationError[];
  isValid: boolean;
  transformedData?: Omit<FoodItemInsert, "id" | "created_at" | "updated_at">;
}

/**
 * CSV parsing result
 */
export interface CSVParseResult {
  rows: ValidatedCSVRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  parseErrors: string[];
}

/**
 * Generate CSV template content for download
 */
export function generateCSVTemplate(): string {
  const headers = CSV_HEADERS.join(",");
  const exampleRows = [
    '"Grilled Chicken Breast",165,31,0,3.6,"100g",false,"130g raw","100g cooked","lunch|dinner"',
    '"Brown Rice",216,5,45,1.8,"1 cup cooked",true,"80g dry","240g cooked","lunch|dinner"',
    '"Greek Yogurt",100,17,6,0.7,"170g",true,,,"breakfast|snack"',
    '"Banana",105,1.3,27,0.4,"1 medium",true,,,"breakfast|snack|pre-workout"',
  ];

  return [headers, ...exampleRows].join("\n");
}

/**
 * Parse a boolean value from CSV string
 */
function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase().trim();
  return normalized === "true" || normalized === "yes" || normalized === "1";
}

/**
 * Parse a number from CSV string
 */
function parseNumber(value: string | undefined): number | null {
  if (!value || value.trim() === "") return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

/**
 * Parse meal types from pipe-separated string
 */
function parseMealTypes(value: string | undefined): string[] | null {
  if (!value || value.trim() === "") return null;
  return value
    .split("|")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
}

/**
 * Validate a single CSV row
 */
export function validateCSVRow(row: RawCSVRow, rowNumber: number): ValidatedCSVRow {
  const errors: CSVValidationError[] = [];

  // Validate required fields
  if (!row.name || row.name.trim() === "") {
    errors.push({ field: "name", message: "Name is required" });
  } else if (row.name.length > 100) {
    errors.push({ field: "name", message: "Name must be 100 characters or less" });
  }

  // Validate calories
  const calories = parseNumber(row.calories);
  if (calories === null) {
    errors.push({ field: "calories", message: "Calories is required and must be a number" });
  } else if (calories < 0 || calories > 5000) {
    errors.push({ field: "calories", message: "Calories must be between 0 and 5000" });
  }

  // Validate protein
  const protein = parseNumber(row.protein);
  if (protein === null) {
    errors.push({ field: "protein", message: "Protein is required and must be a number" });
  } else if (protein < 0 || protein > 500) {
    errors.push({ field: "protein", message: "Protein must be between 0 and 500g" });
  }

  // Validate optional numeric fields
  const carbs = parseNumber(row.carbs);
  if (carbs !== null && (carbs < 0 || carbs > 500)) {
    errors.push({ field: "carbs", message: "Carbs must be between 0 and 500g" });
  }

  const fats = parseNumber(row.fats);
  if (fats !== null && (fats < 0 || fats > 500)) {
    errors.push({ field: "fats", message: "Fats must be between 0 and 500g" });
  }

  // Validate serving size
  if (!row.serving_size || row.serving_size.trim() === "") {
    errors.push({ field: "serving_size", message: "Serving size is required" });
  } else if (row.serving_size.length > 50) {
    errors.push({ field: "serving_size", message: "Serving size must be 50 characters or less" });
  }

  // Validate optional string fields
  if (row.raw_quantity && row.raw_quantity.length > 50) {
    errors.push({ field: "raw_quantity", message: "Raw quantity must be 50 characters or less" });
  }

  if (row.cooked_quantity && row.cooked_quantity.length > 50) {
    errors.push({
      field: "cooked_quantity",
      message: "Cooked quantity must be 50 characters or less",
    });
  }

  const isValid = errors.length === 0;

  // Transform data if valid
  let transformedData: Omit<FoodItemInsert, "id" | "created_at" | "updated_at"> | undefined;
  if (isValid) {
    transformedData = {
      name: row.name!.trim(),
      calories: calories!,
      protein: protein!,
      carbs: carbs,
      fats: fats,
      serving_size: row.serving_size!.trim(),
      is_vegetarian: parseBoolean(row.is_vegetarian),
      raw_quantity: row.raw_quantity?.trim() || null,
      cooked_quantity: row.cooked_quantity?.trim() || null,
      meal_types: parseMealTypes(row.meal_types),
    };
  }

  return {
    rowNumber,
    data: row,
    errors,
    isValid,
    transformedData,
  };
}

/**
 * Check for duplicate names within CSV data
 */
export function checkDuplicates(
  rows: ValidatedCSVRow[],
  existingNames: string[]
): ValidatedCSVRow[] {
  const nameMap = new Map<string, number[]>();
  const existingNamesSet = new Set(existingNames.map((n) => n.toLowerCase()));

  // Build map of names to row numbers
  rows.forEach((row) => {
    const name = row.data.name?.toLowerCase().trim();
    if (name) {
      if (!nameMap.has(name)) {
        nameMap.set(name, []);
      }
      nameMap.get(name)!.push(row.rowNumber);
    }
  });

  // Add duplicate errors
  return rows.map((row) => {
    const name = row.data.name?.toLowerCase().trim();
    if (!name) return row;

    const newErrors = [...row.errors];

    // Check for duplicates within CSV
    const occurrences = nameMap.get(name) || [];
    if (occurrences.length > 1 && occurrences[0] !== row.rowNumber) {
      newErrors.push({
        field: "name",
        message: `Duplicate name found in CSV (also in row ${occurrences[0]})`,
      });
    }

    // Check for existing names in database
    if (existingNamesSet.has(name)) {
      newErrors.push({
        field: "name",
        message: "A food item with this name already exists in the database",
      });
    }

    return {
      ...row,
      errors: newErrors,
      isValid: newErrors.length === 0,
    };
  });
}

/**
 * Parse CSV file content
 */
export function parseCSV(fileContent: string, existingNames: string[] = []): CSVParseResult {
  const parseErrors: string[] = [];

  const result = Papa.parse<RawCSVRow>(fileContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  if (result.errors.length > 0) {
    result.errors.forEach((error) => {
      parseErrors.push(`Row ${error.row}: ${error.message}`);
    });
  }

  // Validate each row
  let validatedRows = result.data.map((row, index) => validateCSVRow(row, index + 2)); // +2 for 1-indexed and header row

  // Check for duplicates
  validatedRows = checkDuplicates(validatedRows, existingNames);

  const validRows = validatedRows.filter((r) => r.isValid).length;

  return {
    rows: validatedRows,
    totalRows: validatedRows.length,
    validRows,
    invalidRows: validatedRows.length - validRows,
    parseErrors,
  };
}

/**
 * Get transformed data from valid rows only
 */
export function getValidFoodItems(
  result: CSVParseResult
): Omit<FoodItemInsert, "id" | "created_at" | "updated_at">[] {
  return result.rows
    .filter((row) => row.isValid && row.transformedData)
    .map((row) => row.transformedData!);
}

/**
 * Download blob as file
 */
export function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download CSV template
 */
export function downloadCSVTemplate(): void {
  const content = generateCSVTemplate();
  downloadBlob(content, "food_items_template.csv", "text/csv;charset=utf-8");
}
