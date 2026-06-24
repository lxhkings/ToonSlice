import { describe, it, expect } from "vitest";
import { runExport } from "./useExport";
import { getChannel } from "../channels";
import { createCanvas } from "@napi-rs/canvas";
import JSZip from "jszip";

const factory = (w: number, h: number) => {
  const cv = createCanvas(w, h);
  return {
    ctx: cv.getContext("2d") as unknown as CanvasRenderingContext2D,
    toBlob: async () =>
      new Blob([cv.toBuffer("image/png")], { type: "image/png" }),
  };
};

describe("runExport", () => {
  it("produces a zip ArrayBuffer and per-panel sizes", async () => {
    const napi = createCanvas(1600, 2000);
    const loaded = [
      {
        image: napi as unknown as CanvasImageSource,
        size: { w: 1600, h: 2000 },
      },
    ];
    const { buf, sizes } = await runExport(
      loaded,
      getChannel("webtoon"),
      40,
      false,
      factory
    );
    expect(buf.byteLength).toBeGreaterThan(0);
    expect(sizes.length).toBeGreaterThan(0);
    expect(sizes.every((s) => s > 0)).toBe(true);
  });
});

describe("runExport — carousel branch", () => {
  it("instagram spec (carouselPage) zips slide_NNN.png entries", async () => {
    const napi = createCanvas(1080, 2000);
    const loaded = [
      {
        image: napi as unknown as CanvasImageSource,
        size: { w: 1080, h: 2000 },
      },
    ];
    const { buf } = await runExport(
      loaded,
      getChannel("instagram"),
      0,
      false,
      factory,
      "1:1"
    );
    const zip = await JSZip.loadAsync(buf);
    const names = Object.keys(zip.files);
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((n) => n.startsWith("slide_"))).toBe(true);
  });
});

describe("runExport — format/quality threading", () => {
  it("defaults to image/jpeg quality 0.9 when caller omits them", async () => {
    let captured: unknown[] = [];
    const capturingFactory = (w: number, h: number, ...args: unknown[]) => {
      captured = args;
      const cv = createCanvas(w, h);
      return {
        ctx: cv.getContext("2d") as unknown as CanvasRenderingContext2D,
        toBlob: async () =>
          new Blob([cv.toBuffer("image/png")], { type: "image/png" }),
      };
    };
    const napi = createCanvas(1600, 2000);
    const loaded = [
      {
        image: napi as unknown as CanvasImageSource,
        size: { w: 1600, h: 2000 },
      },
    ];
    await runExport(loaded, getChannel("webtoon"), 40, false, capturingFactory);
    expect(captured).toEqual(["image/jpeg", 0.9]);
  });
});
