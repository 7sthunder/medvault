import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema } from "@/shared/validations/auth";

describe("registerSchema (plan §13)", () => {
  it("accepts a valid registration", () => {
    const parsed = registerSchema.parse({
      name: "   Sarah Jenkins  ",
      email: "  SARAH@Example.COM ",
      password: "vaultPass9",
    });
    expect(parsed).toEqual({
      name: "Sarah Jenkins",
      email: "sarah@example.com",
      password: "vaultPass9",
    });
  });

  it("normalises email (trim + lowercase)", () => {
    const parsed = registerSchema.parse({
      name: "A B",
      email: "  Aa@Bb.ORG ",
      password: "abcDef12",
    });
    expect(parsed.email).toBe("aa@bb.org");
  });

  it.each([
    ["name too short", { name: "A", email: "x@y.z", password: "abcDef12" }],
    ["invalid email", { name: "Alice", email: "not-an-email", password: "abcDef12" }],
    ["password too short", { name: "Alice", email: "x@y.z", password: "abc12" }],
    ["password missing letter", { name: "Alice", email: "x@y.z", password: "12345678" }],
    ["password missing number", { name: "Alice", email: "x@y.z", password: "abcdefgh" }],
  ])("rejects %s", (_label, input) => {
    const result = registerSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("loginSchema (plan §13)", () => {
  it("accepts valid credentials and normalises the email", () => {
    const parsed = loginSchema.parse({
      email: "  A@b.co ",
      password: "x",
      rememberMe: false,
    });
    expect(parsed).toEqual({ email: "a@b.co", password: "x", rememberMe: false });
  });

  it("accepts rememberMe true from the form", () => {
    const parsed = loginSchema.parse({
      email: "a@b.co",
      password: "x",
      rememberMe: true,
    });
    expect(parsed.rememberMe).toBe(true);
  });

  it("rejects an empty password and invalid email", () => {
    expect(loginSchema.safeParse({ email: "x", password: "" }).success).toBe(false);
  });
});
