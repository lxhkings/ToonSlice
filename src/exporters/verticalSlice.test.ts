import { describe, it, expect } from "vitest";
import { createCanvas, type Canvas } from "@napi-rs/canvas";
import { exportVerticalSlice } from "./verticalSlice";
import { getChannel } from "../channels";

// canvas factory returning {canvas, ctx, toBlob}
const napiFactory = (w: number, h: number) => {
  const cv = createCanvas(w, h);
  return {
    ctx: cv.getContext("2d") as unknown as CanvasRenderingContext2D,
    toBlob: async () =>
      new Blob([cv.toBuffer("image/png")], { type: "image/png" }),
  };
};

describe("exportVerticalSlice", () => {
  it("3000px content sliced into multiple blobs", async () => {
    const spec = getChannel("webtoon"); // W=800, maxH=1280
    // two images, each 1600x3000 → scaled to 800x1500, gutter 40 → total 3040
    const sources = [napiImg(1600, 3000), napiImg(1600, 3000)];
    const blobs = await exportVerticalSlice({
      sources: sources.map((s) => s.image),
      origSizes: sources.map(() => ({ w: 1600, h: 3000 })),
      spec,
      gutter: 40,
      watermark: false,
      canvasFactory: napiFactory,
    });
    expect(blobs.length).toBeGreaterThanOrEqual(3); // 3040 / 1280 ≈ 3 segments
    blobs.forEach((b) => expect(b.size).toBeGreaterThan(0));
  });
});

// create a solid-color napi image
function napiImg(w: number, h: number): {
  image: Canvas;
} {
  const cv = createCanvas(w, h);
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#cccccc";
  ctx.fillRect(0, 0, w, h);
  return { image: cv };
}
