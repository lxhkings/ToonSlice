import { describe, it, expect } from "vitest";
import { createCanvas, type Canvas } from "@napi-rs/canvas";
import { exportVerticalSlice } from "./verticalSlice";
import { getChannel } from "../channels";

// Solid-color napi image helper
function napiImg(w: number, h: number): { image: Canvas } {
  const cv = createCanvas(w, h);
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#aaaaaa";
  ctx.fillRect(0, 0, w, h);
  return { image: cv };
}

// Canvas factory that records each (w, h) it is called with
function capturingFactory(dims: { w: number; h: number }[]) {
  return (w: number, h: number) => {
    const cv = createCanvas(w, h);
    dims.push({ w, h });
    return {
      ctx: cv.getContext("2d") as unknown as CanvasRenderingContext2D,
      toBlob: async () =>
        new Blob([cv.toBuffer("image/png")], { type: "image/png" }),
    };
  };
}

describe("segment continuity and scaling correctness", () => {
  // Test 1: single tall image (800x3000 at W=800 → scaled 3000px) with gutter=0
  // Each segment height summed must equal totalHeight exactly (no overlap, no gap).
  it("A4-Step1: segment heights sum equals totalHeight (no overlap/gap)", async () => {
    const spec = getChannel("webtoon"); // W=800, maxH=1280
    const src = napiImg(800, 3000);

    const dims: { w: number; h: number }[] = [];
    await exportVerticalSlice({
      sources: [src.image as unknown as CanvasImageSource],
      origSizes: [{ w: 800, h: 3000 }],
      spec,
      gutter: 0,
      watermark: false,
      canvasFactory: capturingFactory(dims),
    });

    // 800x3000 at W=800 → scale=1 → scaled height=3000
    const expectedTotalHeight = 3000;
    const sumH = dims.reduce((s, d) => s + d.h, 0);
    expect(sumH).toBe(expectedTotalHeight);
    dims.forEach((d) => expect(d.w).toBe(800));
  });

  // Test 2: scaling correctness — 1600x3000 vs 800x3000 both exported at W=800.
  // Scaled heights: 1500 vs 3000. All segment widths must be 800.
  it("A4-Step2: wide image scales to half height; all segments at channel width", async () => {
    const spec = getChannel("webtoon"); // W=800, maxH=1280

    const dimsA: { w: number; h: number }[] = [];
    const srcA = napiImg(1600, 3000);
    await exportVerticalSlice({
      sources: [srcA.image as unknown as CanvasImageSource],
      origSizes: [{ w: 1600, h: 3000 }],
      spec,
      gutter: 0,
      watermark: false,
      canvasFactory: capturingFactory(dimsA),
    });

    const dimsB: { w: number; h: number }[] = [];
    const srcB = napiImg(800, 3000);
    await exportVerticalSlice({
      sources: [srcB.image as unknown as CanvasImageSource],
      origSizes: [{ w: 800, h: 3000 }],
      spec,
      gutter: 0,
      watermark: false,
      canvasFactory: capturingFactory(dimsB),
    });

    const sumA = dimsA.reduce((s, d) => s + d.h, 0);
    const sumB = dimsB.reduce((s, d) => s + d.h, 0);

    // 1600x3000 at W=800 → scale=0.5 → height=1500
    expect(sumA).toBe(1500);
    // 800x3000 at W=800 → scale=1 → height=3000
    expect(sumB).toBe(3000);
    // sumA is exactly half of sumB
    expect(sumA).toBe(sumB / 2);

    // All segments must render at channel width 800
    dimsA.forEach((d) => expect(d.w).toBe(800));
    dimsB.forEach((d) => expect(d.w).toBe(800));
  });
});
