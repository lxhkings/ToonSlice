import { describe, it, expect } from "vitest";
import { sliceSegments } from "./slice";

describe("sliceSegments", () => {
  it("gutter in range → cut at gutter midpoint", () => {
    // totalHeight 3000, maxH 1280, gutters at [1000,1040] and [2000,2040]
    const segs = sliceSegments(
      3000,
      [
        { start: 1000, end: 1040 },
        { start: 2000, end: 2040 },
      ],
      1280
    );
    // first cut = last gutter midpoint ≤1280 = 1020
    expect(segs[0]).toEqual({ yStart: 0, yEnd: 1020 });
    expect(segs[1].yStart).toBe(1020);
    segs.forEach((s) =>
      expect(s.yEnd - s.yStart).toBeLessThanOrEqual(1280)
    );
  });
  it("no gutter in range → hard cut at maxH", () => {
    const segs = sliceSegments(2000, [], 1280);
    expect(segs[0]).toEqual({ yStart: 0, yEnd: 1280 });
    expect(segs[1]).toEqual({ yStart: 1280, yEnd: 2000 });
  });
  it("totalHeight ≤ maxH → single segment", () => {
    expect(sliceSegments(900, [], 1280)).toEqual([
      { yStart: 0, yEnd: 900 },
    ]);
  });
});
