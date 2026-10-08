import { describe, it, expect } from "vitest";
import { signUpSchema, signInSchema } from "@/lib/validation/auth";

describe("lib/validation/auth", () => {
  describe("signUpSchema", () => {
    it("accepts valid sign up data", () => {
      const valid = {
        name: "Abebe Bikila",
        email: "abebe@example.com",
        password: "Password123!",
      };
      const res = signUpSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("rejects short names", () => {
      const invalid = {
        name: "A",
        email: "abebe@example.com",
        password: "Password123!",
      };
      const res = signUpSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });

    it("rejects invalid emails", () => {
      const invalid = {
        name: "Abebe Bikila",
        email: "not-an-email",
        password: "Password123!",
      };
      const res = signUpSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });

    it("rejects passwords without numbers", () => {
      const invalid = {
        name: "Abebe Bikila",
        email: "abebe@example.com",
        password: "OnlyLettersPassword",
      };
      const res = signUpSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });

    it("rejects passwords shorter than 8 characters", () => {
      const invalid = {
        name: "Abebe Bikila",
        email: "abebe@example.com",
        password: "Pass1",
      };
      const res = signUpSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("signInSchema", () => {
    it("accepts valid email and password", () => {
      const res = signInSchema.safeParse({
        email: "user@example.com",
        password: "anyPassword",
      });
      expect(res.success).toBe(true);
    });

    it("rejects empty password", () => {
      const res = signInSchema.safeParse({
        email: "user@example.com",
        password: "",
      });
      expect(res.success).toBe(false);
    });
  });
});
