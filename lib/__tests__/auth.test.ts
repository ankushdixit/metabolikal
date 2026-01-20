import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from "../auth";

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
