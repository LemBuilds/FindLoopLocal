import { describe, it, expect } from "vitest";
import { safeRedirectPath } from "../safe-redirect";

describe("safeRedirectPath", () => {
  it("allows same-origin relative paths", () => {
    expect(safeRedirectPath("/post/lost", "/feed")).toBe("/post/lost");
    expect(safeRedirectPath("/listings/1?x=2", "/feed")).toBe("/listings/1?x=2");
  });

  it("falls back when the value is missing", () => {
    expect(safeRedirectPath(null, "/feed")).toBe("/feed");
    expect(safeRedirectPath(undefined, "/feed")).toBe("/feed");
    expect(safeRedirectPath("", "/feed")).toBe("/feed");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeRedirectPath("https://evil.com", "/feed")).toBe("/feed");
    expect(safeRedirectPath("//evil.com", "/feed")).toBe("/feed");
    expect(safeRedirectPath("/\\evil.com", "/feed")).toBe("/feed");
    expect(safeRedirectPath("javascript:alert(1)", "/feed")).toBe("/feed");
  });
});
