import { describe, it, expect } from "vitest";
import { runExport } from "./useExport";
import { getChannel } from "../channels";
import { createCanvas } from "@napi-rs/canvas";

const factory = (w: number, h: number) => {
  const cv = createCanvas(w, h);
  return {
    ctx: cv.getContext("2d") as unknown as CanvasRenderingContext2D,
    toBlob: async () =>
      new Blob([cv.toBuffer("image/png")], { type: "image/png" }),
  };
};

describe("runExport", () => {
  it("produces a zip ArrayBuffer", async () => {
    const napi = createCanvas(1600, 2000);
    const loaded = [
      {
        image: napi as unknown as CanvasImageSource,
        size: { w: 1600, h: 2000 },
      },
    ];
    const buf = await runExport(
      loaded,
      getChannel("webtoon"),
      40,
      false,
      factory
    );
    expect(buf.byteLength).toBeGreaterThan(0);
  });
});
