import { describe, it, expect } from "vitest";
import { checkTotalHeight } from "./limits";

describe("checkTotalHeight", () => {
  it("rejects height > 30000px", () => {
    expect(checkTotalHeight(30001)).toBe("TOO_TALL");
  });
  it("returns null for valid height", () => {
    expect(checkTotalHeight(5000)).toBeNull();
  });
});
