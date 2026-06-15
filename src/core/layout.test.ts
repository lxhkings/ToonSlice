import { describe, it, expect } from "vitest";
import { computeLayout } from "./layout";

const W = 800;

describe("computeLayout", () => {
  it("scales proportionally to target width", () => {
    const lo = computeLayout([{ w: 1600, h: 2400 }], W, 0);
    expect(lo.width).toBe(800);
    expect(lo.items[0].height).toBe(1200); // 2400 * 800/1600
    expect(lo.totalHeight).toBe(1200);
  });
  it("two images + gutter total height correct", () => {
    const lo = computeLayout(
      [
        { w: 800, h: 1000 },
        { w: 800, h: 600 },
      ],
      W,
      40
    );
    expect(lo.items[0].y).toBe(0);
    expect(lo.items[1].y).toBe(1040); // 1000 + 40
    expect(lo.totalHeight).toBe(1640);
    expect(lo.gutters).toEqual([{ start: 1000, end: 1040 }]);
  });
  it("no gutter → gutters empty", () => {
    const lo = computeLayout(
      [
        { w: 800, h: 500 },
        { w: 800, h: 500 },
      ],
      W,
      0
    );
    expect(lo.gutters).toEqual([]);
  });
});
