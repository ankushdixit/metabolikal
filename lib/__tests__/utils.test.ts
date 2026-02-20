import { cn, generateUUID } from "../utils";

describe("cn utility function", () => {
  it("merges class names correctly", () => {
    expect(cn("px-2 py-1", "bg-blue-500")).toBe("px-2 py-1 bg-blue-500");
  });

  it("handles conditional classes", () => {
    const isActive = false;
    const isHighlighted = true;
    expect(cn("px-2", isActive && "py-1")).toBe("px-2");
    expect(cn("px-2", isHighlighted && "py-1")).toBe("px-2 py-1");
  });

  it("handles undefined and null values", () => {
    expect(cn("px-2", undefined, null, "py-1")).toBe("px-2 py-1");
  });

  it("merges conflicting Tailwind classes correctly", () => {
    // twMerge should keep the last conflicting class
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
  });

  it("handles array inputs", () => {
    expect(cn(["px-2", "py-1"])).toBe("px-2 py-1");
  });

  it("handles object inputs with boolean values", () => {
    expect(cn({ "px-2": true, "py-1": false, "bg-blue": true })).toBe("px-2 bg-blue");
  });

  it("combines multiple types of inputs", () => {
    const isHidden = false;
    expect(cn("px-2", { "py-1": true }, ["bg-blue"], isHidden && "hidden")).toBe(
      "px-2 py-1 bg-blue"
    );
  });
});

describe("generateUUID", () => {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  describe("when crypto.randomUUID is available", () => {
    it("uses crypto.randomUUID and returns a valid UUID", () => {
      // In Node/jsdom, crypto.randomUUID is available
      const uuid = generateUUID();
      expect(uuid).toMatch(UUID_REGEX);
    });

    it("returns unique values on each call", () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe("when only crypto.getRandomValues is available (no randomUUID)", () => {
    let originalRandomUUID: typeof crypto.randomUUID;

    beforeEach(() => {
      originalRandomUUID = crypto.randomUUID;
      // Remove randomUUID to force getRandomValues fallback
      Object.defineProperty(crypto, "randomUUID", {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(crypto, "randomUUID", {
        value: originalRandomUUID,
        writable: true,
        configurable: true,
      });
    });

    it("falls back to getRandomValues and produces a valid UUID v4", () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(UUID_REGEX);
    });

    it("sets version nibble to 4", () => {
      const uuid = generateUUID();
      // The 13th character (index 14 in the dashed format) is the version
      expect(uuid[14]).toBe("4");
    });

    it("sets variant bits correctly (8, 9, a, or b)", () => {
      const uuid = generateUUID();
      // The 17th character (index 19 in the dashed format) should be 8, 9, a, or b
      expect(["8", "9", "a", "b"]).toContain(uuid[19]);
    });

    it("returns unique values on each call", () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe("when crypto is unavailable (Math.random fallback)", () => {
    let originalCrypto: Crypto;

    beforeEach(() => {
      originalCrypto = global.crypto;
      // Remove crypto entirely to force Math.random fallback
      Object.defineProperty(global, "crypto", {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(global, "crypto", {
        value: originalCrypto,
        writable: true,
        configurable: true,
      });
    });

    it("falls back to Math.random and produces a valid UUID v4 format", () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(UUID_REGEX);
    });

    it("sets version nibble to 4", () => {
      const uuid = generateUUID();
      expect(uuid[14]).toBe("4");
    });

    it("sets variant bits correctly (8, 9, a, or b)", () => {
      const uuid = generateUUID();
      expect(["8", "9", "a", "b"]).toContain(uuid[19]);
    });

    it("returns unique values on each call", () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });
});
