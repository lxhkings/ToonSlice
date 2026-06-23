import { describe, it, expect } from "vitest";
import { checkTotalHeight, checkCarouselPages, MAX_CAROUSEL_PAGES } from "./limits";

describe("checkTotalHeight", () => {
  it("rejects height > 30000px", () => {
    expect(checkTotalHeight(30001)).toBe("TOO_TALL");
  });
  it("returns null for valid height", () => {
    expect(checkTotalHeight(5000)).toBeNull();
  });
});

describe("checkCarouselPages", () => {
  it("rejects more than 10 pages", () => {
    expect(checkCarouselPages(11)).toBe("TOO_MANY_SLIDES");
  });
  it("returns null at exactly 10 pages", () => {
    expect(checkCarouselPages(10)).toBeNull();
  });
  it("returns null for fewer pages", () => {
    expect(checkCarouselPages(3)).toBeNull();
  });
  it("exposes the cap as 10", () => {
    expect(MAX_CAROUSEL_PAGES).toBe(10);
  });
});
