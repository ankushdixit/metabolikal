import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  canAccessDashboard,
  canAccessAdmin,
  isChallenger,
  createBrowserSupabaseClient,
} from "../auth";
import type { UserRole } from "../auth";

describe("loginSchema", () => {
  const validData = {
    email: "test@example.com",
    password: "password123",
  };

  it("validates correct data", () => {
    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  describe("email validation", () => {
    it("rejects invalid email format", () => {
      const result = loginSchema.safeParse({ ...validData, email: "invalid-email" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid email address");
      }
    });

    it("rejects empty email", () => {
      const result = loginSchema.safeParse({ ...validData, email: "" });
      expect(result.success).toBe(false);
    });

    it("accepts valid email formats", () => {
      const validEmails = ["user@example.com", "user.name@example.com", "user+tag@example.co.uk"];

      validEmails.forEach((email) => {
        const result = loginSchema.safeParse({ ...validData, email });
        expect(result.success).toBe(true);
      });
    });
  });

  describe("password validation", () => {
    it("rejects empty password", () => {
      const result = loginSchema.safeParse({ ...validData, password: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Password is required");
      }
    });

    it("accepts any non-empty password", () => {
      const result = loginSchema.safeParse({ ...validData, password: "a" });
      expect(result.success).toBe(true);
    });
  });
});

describe("registerSchema", () => {
  const validData = {
    fullName: "John Doe",
    email: "john@example.com",
    password: "password123",
    confirmPassword: "password123",
  };

  it("validates correct data", () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  describe("fullName validation", () => {
    it("rejects empty full name", () => {
      const result = registerSchema.safeParse({ ...validData, fullName: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Full name is required");
      }
    });

    it("accepts valid names", () => {
      const validNames = ["John", "John Doe", "Mary Jane Watson"];

      validNames.forEach((fullName) => {
        const result = registerSchema.safeParse({ ...validData, fullName });
        expect(result.success).toBe(true);
      });
    });
  });

  describe("email validation", () => {
    it("rejects invalid email format", () => {
      const result = registerSchema.safeParse({ ...validData, email: "invalid" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid email address");
      }
    });
  });

  describe("password validation", () => {
    it("rejects password shorter than 8 characters", () => {
      const result = registerSchema.safeParse({
        ...validData,
        password: "short",
        confirmPassword: "short",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Password must be at least 8 characters");
      }
    });

    it("accepts password of exactly 8 characters", () => {
      const result = registerSchema.safeParse({
        ...validData,
        password: "12345678",
        confirmPassword: "12345678",
      });
      expect(result.success).toBe(true);
    });

    it("accepts longer passwords", () => {
      const result = registerSchema.safeParse({
        ...validData,
        password: "verylongpassword123",
        confirmPassword: "verylongpassword123",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("confirmPassword validation", () => {
    it("rejects non-matching passwords", () => {
      const result = registerSchema.safeParse({
        ...validData,
        password: "password123",
        confirmPassword: "different456",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Passwords do not match");
      }
    });

    it("accepts matching passwords", () => {
      const result = registerSchema.safeParse({
        ...validData,
        password: "samepassword",
        confirmPassword: "samepassword",
      });
      expect(result.success).toBe(true);
    });
  });
});

describe("forgotPasswordSchema", () => {
  it("validates correct email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "test@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email format", () => {
    const result = forgotPasswordSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid email address");
    }
  });

  it("rejects empty email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  const validData = {
    password: "newpassword123",
    confirmPassword: "newpassword123",
  };

  it("validates correct data", () => {
    const result = resetPasswordSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  describe("password validation", () => {
    it("rejects password shorter than 8 characters", () => {
      const result = resetPasswordSchema.safeParse({
        password: "short",
        confirmPassword: "short",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Password must be at least 8 characters");
      }
    });

    it("accepts password of 8+ characters", () => {
      const result = resetPasswordSchema.safeParse({
        password: "longenough",
        confirmPassword: "longenough",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("confirmPassword validation", () => {
    it("rejects non-matching passwords", () => {
      const result = resetPasswordSchema.safeParse({
        password: "newpassword123",
        confirmPassword: "differentpassword",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Passwords do not match");
      }
    });

    it("accepts matching passwords", () => {
      const result = resetPasswordSchema.safeParse({
        password: "matchingpassword",
        confirmPassword: "matchingpassword",
      });
      expect(result.success).toBe(true);
    });
  });
});

// =============================================================================
// Role Helper Functions
// =============================================================================

describe("canAccessDashboard", () => {
  it("returns true for admin role", () => {
    expect(canAccessDashboard("admin")).toBe(true);
  });

  it("returns true for client role", () => {
    expect(canAccessDashboard("client")).toBe(true);
  });

  it("returns false for challenger role", () => {
    expect(canAccessDashboard("challenger")).toBe(false);
  });

  it("returns false for unknown/invalid role", () => {
    expect(canAccessDashboard("unknown" as UserRole)).toBe(false);
  });
});

describe("canAccessAdmin", () => {
  it("returns true for admin role", () => {
    expect(canAccessAdmin("admin")).toBe(true);
  });

  it("returns false for client role", () => {
    expect(canAccessAdmin("client")).toBe(false);
  });

  it("returns false for challenger role", () => {
    expect(canAccessAdmin("challenger")).toBe(false);
  });

  it("returns false for unknown/invalid role", () => {
    expect(canAccessAdmin("viewer" as UserRole)).toBe(false);
  });
});

describe("isChallenger", () => {
  it("returns true for challenger role", () => {
    expect(isChallenger("challenger")).toBe(true);
  });

  it("returns false for admin role", () => {
    expect(isChallenger("admin")).toBe(false);
  });

  it("returns false for client role", () => {
    expect(isChallenger("client")).toBe(false);
  });

  it("returns false for unknown/invalid role", () => {
    expect(isChallenger("moderator" as UserRole)).toBe(false);
  });
});

// =============================================================================
// createBrowserSupabaseClient (singleton behavior)
// =============================================================================

describe("createBrowserSupabaseClient", () => {
  it("returns a Supabase client object", () => {
    const client = createBrowserSupabaseClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
    expect(client.from).toBeDefined();
  });

  it("returns the same instance on subsequent calls (singleton)", () => {
    const client1 = createBrowserSupabaseClient();
    const client2 = createBrowserSupabaseClient();
    expect(client1).toBe(client2);
  });
});

// =============================================================================
// Validation Schema Edge Cases
// =============================================================================

describe("validation schema edge cases", () => {
  describe("loginSchema", () => {
    it("rejects missing fields entirely", () => {
      const result = loginSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects null values", () => {
      const result = loginSchema.safeParse({ email: null, password: null });
      expect(result.success).toBe(false);
    });

    it("rejects non-string types", () => {
      const result = loginSchema.safeParse({ email: 123, password: true });
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("rejects missing confirmPassword", () => {
      const result = registerSchema.safeParse({
        fullName: "Test",
        email: "test@example.com",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects when all fields are empty strings", () => {
      const result = registerSchema.safeParse({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password of exactly 7 characters even if matching", () => {
      const result = registerSchema.safeParse({
        fullName: "Test User",
        email: "test@example.com",
        password: "1234567",
        confirmPassword: "1234567",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("forgotPasswordSchema", () => {
    it("rejects missing email field", () => {
      const result = forgotPasswordSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects email with just @ symbol", () => {
      const result = forgotPasswordSchema.safeParse({ email: "@" });
      expect(result.success).toBe(false);
    });
  });

  describe("resetPasswordSchema", () => {
    it("rejects missing fields entirely", () => {
      const result = resetPasswordSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects password of exactly 7 characters", () => {
      const result = resetPasswordSchema.safeParse({
        password: "1234567",
        confirmPassword: "1234567",
      });
      expect(result.success).toBe(false);
    });

    it("reports password mismatch on the confirmPassword path", () => {
      const result = resetPasswordSchema.safeParse({
        password: "password123",
        confirmPassword: "password456",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmErr = result.error.issues.find((issue) =>
          issue.path.includes("confirmPassword")
        );
        expect(confirmErr).toBeDefined();
        expect(confirmErr?.message).toBe("Passwords do not match");
      }
    });
  });
});
