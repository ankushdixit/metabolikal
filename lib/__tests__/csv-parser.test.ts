import {
  parseCSV,
  validateCSVRow,
  checkDuplicates,
  generateCSVTemplate,
  downloadCSVTemplate,
  getValidFoodItems,
  CSV_HEADERS,
  type RawCSVRow,
  type ValidatedCSVRow,
} from "../csv-parser";

describe("csv-parser", () => {
  describe("CSV_HEADERS", () => {
    it("should contain all expected headers", () => {
      expect(CSV_HEADERS).toContain("name");
      expect(CSV_HEADERS).toContain("calories");
      expect(CSV_HEADERS).toContain("protein");
      expect(CSV_HEADERS).toContain("carbs");
      expect(CSV_HEADERS).toContain("fats");
      expect(CSV_HEADERS).toContain("serving_size");
      expect(CSV_HEADERS).toContain("is_vegetarian");
      expect(CSV_HEADERS).toContain("raw_quantity");
      expect(CSV_HEADERS).toContain("cooked_quantity");
      expect(CSV_HEADERS).toContain("meal_types");
      expect(CSV_HEADERS).toContain("avoid_for_conditions");
    });
  });

  describe("generateCSVTemplate", () => {
    it("should generate template with headers", () => {
      const template = generateCSVTemplate();
      const lines = template.split("\n");

      // First line should be headers
      expect(lines[0]).toBe(CSV_HEADERS.join(","));
    });

    it("should include example rows", () => {
      const template = generateCSVTemplate();
      const lines = template.split("\n");

      // Should have header + at least one example
      expect(lines.length).toBeGreaterThan(1);

      // Second line should contain example food
      expect(lines[1]).toContain("Grilled Chicken Breast");
    });
  });

  describe("validateCSVRow", () => {
    it("should validate a valid row", () => {
      const row: RawCSVRow = {
        name: "Grilled Chicken",
        calories: "165",
        protein: "31",
        serving_size: "100g",
      };

      const result = validateCSVRow(row, 2);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.rowNumber).toBe(2);
      expect(result.transformedData).toBeDefined();
      expect(result.transformedData?.name).toBe("Grilled Chicken");
      expect(result.transformedData?.calories).toBe(165);
      expect(result.transformedData?.protein).toBe(31);
    });

    it("should detect missing required fields", () => {
      const row: RawCSVRow = {};

      const result = validateCSVRow(row, 2);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.field === "name")).toBe(true);
      expect(result.errors.some((e) => e.field === "calories")).toBe(true);
      expect(result.errors.some((e) => e.field === "protein")).toBe(true);
      expect(result.errors.some((e) => e.field === "serving_size")).toBe(true);
    });

    it("should detect invalid numeric values", () => {
      const row: RawCSVRow = {
        name: "Test Food",
        calories: "abc",
        protein: "xyz",
        serving_size: "100g",
      };

      const result = validateCSVRow(row, 2);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "calories")).toBe(true);
      expect(result.errors.some((e) => e.field === "protein")).toBe(true);
    });

    it("should detect values out of range", () => {
      const row: RawCSVRow = {
        name: "Test Food",
        calories: "10000", // Max 5000
        protein: "600", // Max 500
        serving_size: "100g",
      };

      const result = validateCSVRow(row, 2);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "calories")).toBe(true);
      expect(result.errors.some((e) => e.field === "protein")).toBe(true);
    });

    it("should detect name too long", () => {
      const row: RawCSVRow = {
        name: "A".repeat(101),
        calories: "100",
        protein: "10",
        serving_size: "100g",
      };

      const result = validateCSVRow(row, 2);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "name" && e.message.includes("100"))).toBe(true);
    });

    it("should parse boolean values correctly", () => {
      const trueValues = ["true", "TRUE", "yes", "YES", "1"];
      const falseValues = ["false", "FALSE", "no", "NO", "0", ""];

      for (const val of trueValues) {
        const row: RawCSVRow = {
          name: "Test",
          calories: "100",
          protein: "10",
          serving_size: "100g",
          is_vegetarian: val,
        };
        const result = validateCSVRow(row, 2);
        expect(result.transformedData?.is_vegetarian).toBe(true);
      }

      for (const val of falseValues) {
        const row: RawCSVRow = {
          name: "Test",
          calories: "100",
          protein: "10",
          serving_size: "100g",
          is_vegetarian: val,
        };
        const result = validateCSVRow(row, 2);
        expect(result.transformedData?.is_vegetarian).toBe(false);
      }
    });

    it("should parse meal types correctly", () => {
      const row: RawCSVRow = {
        name: "Test",
        calories: "100",
        protein: "10",
        serving_size: "100g",
        meal_types: "breakfast|lunch|dinner",
      };

      const result = validateCSVRow(row, 2);

      expect(result.transformedData?.meal_types).toEqual(["breakfast", "lunch", "dinner"]);
    });

    it("should parse condition slugs correctly", () => {
      const row: RawCSVRow = {
        name: "Test",
        calories: "100",
        protein: "10",
        serving_size: "100g",
        avoid_for_conditions: "type2-diabetes|insulin-resistance|hypothyroidism",
      };

      const result = validateCSVRow(row, 2);

      expect(result.conditionSlugs).toEqual([
        "type2-diabetes",
        "insulin-resistance",
        "hypothyroidism",
      ]);
    });

    it("should normalize condition slugs", () => {
      const row: RawCSVRow = {
        name: "Test",
        calories: "100",
        protein: "10",
        serving_size: "100g",
        avoid_for_conditions: "Type2 Diabetes|Insulin Resistance|PCOS",
      };

      const result = validateCSVRow(row, 2);

      expect(result.conditionSlugs).toEqual(["type2-diabetes", "insulin-resistance", "pcos"]);
    });

    it("should return empty array when no conditions specified", () => {
      const row: RawCSVRow = {
        name: "Test",
        calories: "100",
        protein: "10",
        serving_size: "100g",
        avoid_for_conditions: "",
      };

      const result = validateCSVRow(row, 2);

      expect(result.conditionSlugs).toEqual([]);
    });

    it("should handle empty optional fields", () => {
      const row: RawCSVRow = {
        name: "Test",
        calories: "100",
        protein: "10",
        serving_size: "100g",
        carbs: "",
        fats: "",
        raw_quantity: "",
        cooked_quantity: "",
        meal_types: "",
      };

      const result = validateCSVRow(row, 2);

      expect(result.isValid).toBe(true);
      expect(result.transformedData?.carbs).toBeNull();
      expect(result.transformedData?.fats).toBeNull();
      expect(result.transformedData?.raw_quantity).toBeNull();
      expect(result.transformedData?.cooked_quantity).toBeNull();
      expect(result.transformedData?.meal_types).toBeNull();
    });

    it("should detect carbs out of range (negative)", () => {
      const row: RawCSVRow = {
        name: "Test",
        calories: "100",
        protein: "10",
        serving_size: "100",
        carbs: "-5",
      };

      const result = validateCSVRow(row, 2);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "carbs")).toBe(true);
    });

    it("should detect carbs out of range (above 500)", () => {
      const row: RawCSVRow = {
        name: "Test",
        calories: "100",
        protein: "10",
        serving_size: "100",
        carbs: "501",
      };

      const result = validateCSVRow(row, 2);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "carbs")).toBe(true);
    });

    it("should detect fats out of range (negative)", () => {
      const row: RawCSVRow = {
        name: "Test",
        calories: "100",
        protein: "10",
        serving_size: "100",
        fats: "-1",
      };

      const result = validateCSVRow(row, 2);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "fats")).toBe(true);
    });

    it("should detect fats out of range (above 500)", () => {
      const row: RawCSVRow = {
        name: "Test",
        calories: "100",
        protein: "10",
        serving_size: "100",
        fats: "501",
      };

      const result = validateCSVRow(row, 2);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "fats")).toBe(true);
    });

    it("should detect serving_size out of range (below 1)", () => {
      const row: RawCSVRow = {
        name: "Test",
        calories: "100",
        protein: "10",
        serving_size: "0",
      };

      const result = validateCSVRow(row, 2);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.field === "serving_size" && e.message.includes("between"))
      ).toBe(true);
    });

    it("should detect serving_size out of range (above 5000)", () => {
      const row: RawCSVRow = {
        name: "Test",
        calories: "100",
        protein: "10",
        serving_size: "5001",
      };

      const result = validateCSVRow(row, 2);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.field === "serving_size" && e.message.includes("between"))
      ).toBe(true);
    });

    it("should detect non-numeric raw_quantity", () => {
      const row: RawCSVRow = {
        name: "Test",
        calories: "100",
        protein: "10",
        serving_size: "100",
        raw_quantity: "abc",
      };

      const result = validateCSVRow(row, 2);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.field === "raw_quantity" && e.message.includes("number"))
      ).toBe(true);
    });

    it("should detect raw_quantity out of range (below 1)", () => {
      const row: RawCSVRow = {
        name: "Test",
        calories: "100",
        protein: "10",
        serving_size: "100",
        raw_quantity: "0",
      };

      const result = validateCSVRow(row, 2);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.field === "raw_quantity" && e.message.includes("between"))
      ).toBe(true);
    });

    it("should detect raw_quantity out of range (above 5000)", () => {
      const row: RawCSVRow = {
        name: "Test",
        calories: "100",
        protein: "10",
        serving_size: "100",
        raw_quantity: "5001",
      };

      const result = validateCSVRow(row, 2);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.field === "raw_quantity" && e.message.includes("between"))
      ).toBe(true);
    });

    it("should detect non-numeric cooked_quantity", () => {
      const row: RawCSVRow = {
        name: "Test",
        calories: "100",
        protein: "10",
        serving_size: "100",
        cooked_quantity: "xyz",
      };

      const result = validateCSVRow(row, 2);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.field === "cooked_quantity" && e.message.includes("number"))
      ).toBe(true);
    });

    it("should detect cooked_quantity out of range (below 1)", () => {
      const row: RawCSVRow = {
        name: "Test",
        calories: "100",
        protein: "10",
        serving_size: "100",
        cooked_quantity: "0",
      };

      const result = validateCSVRow(row, 2);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.field === "cooked_quantity" && e.message.includes("between"))
      ).toBe(true);
    });

    it("should detect cooked_quantity out of range (above 5000)", () => {
      const row: RawCSVRow = {
        name: "Test",
        calories: "100",
        protein: "10",
        serving_size: "100",
        cooked_quantity: "5001",
      };

      const result = validateCSVRow(row, 2);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.field === "cooked_quantity" && e.message.includes("between"))
      ).toBe(true);
    });

    it("should detect negative calories", () => {
      const row: RawCSVRow = {
        name: "Test",
        calories: "-10",
        protein: "10",
        serving_size: "100",
      };

      const result = validateCSVRow(row, 2);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.field === "calories" && e.message.includes("between"))
      ).toBe(true);
    });

    it("should detect negative protein", () => {
      const row: RawCSVRow = {
        name: "Test",
        calories: "100",
        protein: "-5",
        serving_size: "100",
      };

      const result = validateCSVRow(row, 2);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.field === "protein" && e.message.includes("between"))
      ).toBe(true);
    });

    it("should handle valid row with all optional fields populated", () => {
      const row: RawCSVRow = {
        name: "Full Item",
        calories: "200",
        protein: "20",
        carbs: "30",
        fats: "10",
        serving_size: "150",
        is_vegetarian: "true",
        raw_quantity: "120",
        cooked_quantity: "100",
        meal_types: "lunch|dinner",
        avoid_for_conditions: "type2-diabetes|pcos",
      };

      const result = validateCSVRow(row, 5);

      expect(result.isValid).toBe(true);
      expect(result.transformedData).toBeDefined();
      expect(result.transformedData?.carbs).toBe(30);
      expect(result.transformedData?.fats).toBe(10);
      expect(result.transformedData?.is_vegetarian).toBe(true);
      expect(result.transformedData?.raw_quantity).toBe("120");
      expect(result.transformedData?.cooked_quantity).toBe("100");
      expect(result.transformedData?.meal_types).toEqual(["lunch", "dinner"]);
      expect(result.conditionSlugs).toEqual(["type2-diabetes", "pcos"]);
    });

    it("should not produce transformedData for invalid rows", () => {
      const row: RawCSVRow = {
        name: "",
        calories: "abc",
        protein: "",
        serving_size: "",
      };

      const result = validateCSVRow(row, 2);

      expect(result.isValid).toBe(false);
      expect(result.transformedData).toBeUndefined();
    });

    it("should handle empty name (whitespace only)", () => {
      const row: RawCSVRow = {
        name: "   ",
        calories: "100",
        protein: "10",
        serving_size: "100",
      };

      const result = validateCSVRow(row, 2);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "name")).toBe(true);
    });
  });

  describe("checkDuplicates", () => {
    it("should detect duplicates within CSV", () => {
      const rows: ValidatedCSVRow[] = [
        {
          rowNumber: 2,
          data: { name: "Apple" },
          errors: [],
          isValid: true,
        },
        {
          rowNumber: 3,
          data: { name: "Apple" },
          errors: [],
          isValid: true,
        },
        {
          rowNumber: 4,
          data: { name: "Banana" },
          errors: [],
          isValid: true,
        },
      ];

      const result = checkDuplicates(rows, []);

      // First Apple should remain valid
      expect(result[0].isValid).toBe(true);
      // Second Apple should have duplicate error
      expect(result[1].isValid).toBe(false);
      expect(result[1].errors.some((e) => e.message.includes("Duplicate"))).toBe(true);
      // Banana should remain valid
      expect(result[2].isValid).toBe(true);
    });

    it("should detect duplicates with existing database items", () => {
      const rows: ValidatedCSVRow[] = [
        {
          rowNumber: 2,
          data: { name: "Apple" },
          errors: [],
          isValid: true,
        },
        {
          rowNumber: 3,
          data: { name: "Banana" },
          errors: [],
          isValid: true,
        },
      ];

      const existingNames = ["apple", "Orange"]; // Case insensitive

      const result = checkDuplicates(rows, existingNames);

      expect(result[0].isValid).toBe(false);
      expect(result[0].errors.some((e) => e.message.includes("already exists"))).toBe(true);
      expect(result[1].isValid).toBe(true);
    });

    it("should be case insensitive", () => {
      const rows: ValidatedCSVRow[] = [
        {
          rowNumber: 2,
          data: { name: "APPLE" },
          errors: [],
          isValid: true,
        },
        {
          rowNumber: 3,
          data: { name: "apple" },
          errors: [],
          isValid: true,
        },
      ];

      const result = checkDuplicates(rows, []);

      expect(result[0].isValid).toBe(true);
      expect(result[1].isValid).toBe(false);
    });

    it("should handle rows with no name", () => {
      const rows: ValidatedCSVRow[] = [
        {
          rowNumber: 2,
          data: {},
          errors: [{ field: "name", message: "Name is required" }],
          isValid: false,
        },
        {
          rowNumber: 3,
          data: { name: "Apple" },
          errors: [],
          isValid: true,
        },
      ];

      const result = checkDuplicates(rows, []);

      // Row without name should pass through unchanged
      expect(result[0].isValid).toBe(false);
      expect(result[1].isValid).toBe(true);
    });

    it("should preserve existing errors when adding duplicate errors", () => {
      const rows: ValidatedCSVRow[] = [
        {
          rowNumber: 2,
          data: { name: "Apple" },
          errors: [],
          isValid: true,
        },
        {
          rowNumber: 3,
          data: { name: "Apple" },
          errors: [{ field: "calories", message: "Calories is required" }],
          isValid: false,
        },
      ];

      const result = checkDuplicates(rows, []);

      // Second row should have both original error and duplicate error
      expect(result[1].errors.length).toBe(2);
      expect(result[1].errors.some((e) => e.field === "calories")).toBe(true);
      expect(result[1].errors.some((e) => e.message.includes("Duplicate"))).toBe(true);
    });
  });

  describe("parseCSV", () => {
    it("should parse valid CSV content", () => {
      const content = `name,calories,protein,serving_size
Chicken,165,31,100g
Rice,130,3,1 cup`;

      const result = parseCSV(content);

      expect(result.totalRows).toBe(2);
      expect(result.validRows).toBe(2);
      expect(result.invalidRows).toBe(0);
      expect(result.parseErrors).toHaveLength(0);
    });

    it("should detect validation errors", () => {
      const content = `name,calories,protein,serving_size
Chicken,abc,31,100g
Rice,130,3,1 cup`;

      const result = parseCSV(content);

      expect(result.totalRows).toBe(2);
      expect(result.validRows).toBe(1);
      expect(result.invalidRows).toBe(1);
    });

    it("should skip empty lines", () => {
      const content = `name,calories,protein,serving_size
Chicken,165,31,100g

Rice,130,3,1 cup

`;

      const result = parseCSV(content);

      expect(result.totalRows).toBe(2);
    });

    it("should normalize header names", () => {
      const content = `Name,Calories,PROTEIN,Serving Size
Chicken,165,31,100g`;

      const result = parseCSV(content);

      expect(result.validRows).toBe(1);
      expect(result.rows[0].isValid).toBe(true);
    });

    it("should check against existing names", () => {
      const content = `name,calories,protein,serving_size
Chicken,165,31,100g
Rice,130,3,1 cup`;

      const result = parseCSV(content, ["Chicken"]);

      expect(result.validRows).toBe(1);
      expect(result.invalidRows).toBe(1);
      expect(result.rows[0].errors.some((e) => e.message.includes("already exists"))).toBe(true);
    });

    it("should use row numbers starting at 2 (1-indexed plus header)", () => {
      const content = `name,calories,protein,serving_size
Chicken,165,31,100g
Rice,130,3,1 cup`;

      const result = parseCSV(content);

      expect(result.rows[0].rowNumber).toBe(2);
      expect(result.rows[1].rowNumber).toBe(3);
    });
  });

  describe("downloadBlob", () => {
    it("should create and trigger a download link", () => {
      const { downloadBlob } = require("../csv-parser");

      const mockClick = jest.fn();
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();
      const mockCreateObjectURL = jest.fn().mockReturnValue("blob:test-url");
      const mockRevokeObjectURL = jest.fn();

      const mockLink = {
        href: "",
        download: "",
        click: mockClick,
      };

      jest.spyOn(document, "createElement").mockReturnValue(mockLink as unknown as HTMLElement);
      jest.spyOn(document.body, "appendChild").mockImplementation(mockAppendChild);
      jest.spyOn(document.body, "removeChild").mockImplementation(mockRemoveChild);
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      downloadBlob("test content", "test.csv", "text/csv");

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockLink.href).toBe("blob:test-url");
      expect(mockLink.download).toBe("test.csv");
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:test-url");

      jest.restoreAllMocks();
    });
  });

  describe("downloadCSVTemplate", () => {
    it("should create a download link with template content", () => {
      // Mock DOM methods used by downloadBlob (called internally)
      const mockClick = jest.fn();
      const mockAppendChild = jest
        .spyOn(document.body, "appendChild")
        .mockImplementation((node) => node);
      const mockRemoveChild = jest
        .spyOn(document.body, "removeChild")
        .mockImplementation((node) => node);
      const mockCreateObjectURL = jest.fn().mockReturnValue("blob:test-url");
      const mockRevokeObjectURL = jest.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      const mockLink = { href: "", download: "", click: mockClick };
      jest.spyOn(document, "createElement").mockReturnValue(mockLink as unknown as HTMLElement);

      downloadCSVTemplate();

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockLink.download).toBe("food_items_template.csv");
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:test-url");

      mockAppendChild.mockRestore();
      mockRemoveChild.mockRestore();
      jest.restoreAllMocks();
    });
  });

  describe("getValidFoodItems", () => {
    it("should return only valid transformed items", () => {
      const content = `name,calories,protein,serving_size
Chicken,165,31,100g
Invalid,,31,100g
Rice,130,3,1 cup`;

      const parseResult = parseCSV(content);
      const validItems = getValidFoodItems(parseResult);

      expect(validItems).toHaveLength(2);
      expect(validItems[0].name).toBe("Chicken");
      expect(validItems[1].name).toBe("Rice");
    });

    it("should return empty array when no valid items", () => {
      const content = `name,calories,protein,serving_size
,abc,31,
Invalid,,31,`;

      const parseResult = parseCSV(content);
      const validItems = getValidFoodItems(parseResult);

      expect(validItems).toHaveLength(0);
    });
  });
});
