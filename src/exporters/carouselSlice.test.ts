import { describe, it, expect } from "vitest";
import { createCanvas, Image, type Canvas } from "@napi-rs/canvas";
import { exportCarouselSlice, pageHeightFor } from "./carouselSlice";
import { getChannel } from "../channels";

const napiFactory = (w: number, h: number) => {
  const cv = createCanvas(w, h);
  return {
    ctx: cv.getContext("2d") as unknown as CanvasRenderingContext2D,
    toBlob: async () =>
      new Blob([cv.toBuffer("image/png")], { type: "image/png" }),
  };
};

function napiImg(w: number, h: number): { image: Canvas } {
  const cv = createCanvas(w, h);
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#888888";
  ctx.fillRect(0, 0, w, h);
  return { image: cv };
}

// jsdom's global Blob lacks .arrayBuffer() (same gap noted in HANDOFF.md for
// packZip); FileReader works under jsdom, so use it to read bytes back.
async function decodeDims(b: Blob): Promise<{ width: number; height: number }> {
  const buf = await new Promise<ArrayBuffer>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as ArrayBuffer);
    fr.onerror = () => reject(fr.error);
    fr.readAsArrayBuffer(b);
  });
  const img = new Image();
  img.src = new Uint8Array(buf);
  return { width: img.width, height: img.height };
}

describe("pageHeightFor", () => {
  it("4:5 at width 1080 -> 1350", () => {
    expect(pageHeightFor(1080, "4:5")).toBe(1350);
  });
  it("1:1 at width 1080 -> 1080", () => {
    expect(pageHeightFor(1080, "1:1")).toBe(1080);
  });
});

describe("exportCarouselSlice", () => {
  it("every slide is exactly canvasWidth x pageHeight (4:5)", async () => {
    const spec = getChannel("instagram"); // canvasWidth=1080
    const src = napiImg(1080, 4000); // tall single image, no scaling needed
    const blobs = await exportCarouselSlice({
      sources: [src.image as unknown as CanvasImageSource],
      origSizes: [{ w: 1080, h: 4000 }],
      spec,
      gutter: 0,
      watermark: false,
      aspect: "4:5",
      canvasFactory: napiFactory,
    });
    expect(blobs.length).toBeGreaterThan(1);
    for (const b of blobs) {
      const dims = await decodeDims(b);
      expect(dims.width).toBe(1080);
      expect(dims.height).toBe(1350);
    }
  });

  it("every slide is exactly canvasWidth x pageHeight (1:1)", async () => {
    const spec = getChannel("instagram");
    const src = napiImg(1080, 2500);
    const blobs = await exportCarouselSlice({
      sources: [src.image as unknown as CanvasImageSource],
      origSizes: [{ w: 1080, h: 2500 }],
      spec,
      gutter: 0,
      watermark: false,
      aspect: "1:1",
      canvasFactory: napiFactory,
    });
    for (const b of blobs) {
      const dims = await decodeDims(b);
      expect(dims.width).toBe(1080);
      expect(dims.height).toBe(1080);
    }
  });

  it("gutter forces a cut; no slide count regresses below ceil(content/page)", async () => {
    const spec = getChannel("instagram");
    // Two 1080x1300 images stacked with gutter 40 -> total height 1300+40+1300=2640
    // pageHeight(4:5)=1350: first cut should land at the gutter (1300..1340 midpoint=1320), not a hard cut at 1350
    const sources = [napiImg(1080, 1300), napiImg(1080, 1300)];
    const blobs = await exportCarouselSlice({
      sources: sources.map((s) => s.image as unknown as CanvasImageSource),
      origSizes: [
        { w: 1080, h: 1300 },
        { w: 1080, h: 1300 },
      ],
      spec,
      gutter: 40,
      watermark: false,
      aspect: "4:5",
      canvasFactory: napiFactory,
    });
    // total 2640 with a gutter cut at 1320 -> 2 slides (1320, 1320), each padded to 1350
    expect(blobs.length).toBe(2);
    for (const b of blobs) {
      const dims = await decodeDims(b);
      expect(dims.height).toBe(1350);
    }
  });

  it("watermark=true lands the banner in the last slide", async () => {
    const spec = getChannel("instagram");
    const src = napiImg(1080, 1000);
    const blobs = await exportCarouselSlice({
      sources: [src.image as unknown as CanvasImageSource],
      origSizes: [{ w: 1080, h: 1000 }],
      spec,
      gutter: 0,
      watermark: true,
      aspect: "1:1",
      canvasFactory: napiFactory,
    });
    // content 1000 + banner 60 = 1060, well under pageHeight 1080 -> single slide
    expect(blobs.length).toBe(1);
    const dims = await decodeDims(blobs[0]);
    expect(dims.height).toBe(1080);
  });
});
