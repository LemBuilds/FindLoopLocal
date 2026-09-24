import { describe, it, expect } from "vitest";
import { detectPii } from "../privacy";

describe("detectPii", () => {
  it("detects UK mobile numbers", () => {
    const result = detectPii("call me on 07712345678 anytime");
    expect(result.hasPii).toBe(true);
    expect(result.labels).toContain("phone number");
  });

  it("detects +44 international format", () => {
    const result = detectPii("+447712345678");
    expect(result.hasPii).toBe(true);
    expect(result.labels).toContain("phone number");
  });

  it("detects email addresses", () => {
    const result = detectPii("email me at james@example.com");
    expect(result.hasPii).toBe(true);
    expect(result.labels).toContain("email address");
  });

  it("detects UK postcodes", () => {
    const result = detectPii("I lost it near E1 6RF");
    expect(result.hasPii).toBe(true);
    expect(result.labels).toContain("postcode");
  });

  it("returns no PII for clean text", () => {
    const result = detectPii("Black leather wallet with loyalty cards inside");
    expect(result.hasPii).toBe(false);
    expect(result.labels).toHaveLength(0);
  });

  it("returns unique labels even if multiple matches", () => {
    const result = detectPii("07712345678 and also 07799999999");
    expect(result.labels.filter((l) => l === "phone number")).toHaveLength(1);
  });
});
