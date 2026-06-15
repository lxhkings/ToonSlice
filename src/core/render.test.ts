import { describe, it, expect, vi } from "vitest";
import { renderSegment } from "./render";
import type { LayoutItem } from "./layout";
import { WATERMARK_HEIGHT } from "./layout";

const fakeImg = (id: string) => ({ id }) as unknown as CanvasImageSource;

function mockCtx() {
  return {
    fillStyle: "",
    font: "",
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    fillText: vi.fn(),
  } as unknown as CanvasRenderingContext2D & {
    drawImage: ReturnType<typeof vi.fn>;
    fillRect: ReturnType<typeof vi.fn>;
    fillText: ReturnType<typeof vi.fn>;
  };
}

describe("renderSegment", () => {
  it("fills white bg + draws intersecting image (clipped)", () => {
    const ctx = mockCtx();
    const items: LayoutItem[] = [
      { y: 0, height: 1000, scale: 0.5 }, // img0: 0..1000
      { y: 1040, height: 600, scale: 0.5 }, // img1: 1040..1640
    ];
    const sources = [fakeImg("a"), fakeImg("b")];
    const origSizes = [
      { w: 1600, h: 2000 },
      { w: 1600, h: 1200 },
    ];
    // segment [1020, 1640]: img0 ends at 1000 (no intersection), img1 fully inside
    renderSegment(
      ctx,
      { yStart: 1020, yEnd: 1640 },
      800,
      items,
      sources,
      origSizes
    );

    // white background
    expect((ctx as any).fillRect).toHaveBeenCalledWith(0, 0, 800, 620);
    // only img1 drawn (img0 ends above 1020, no intersection)
    expect((ctx as any).drawImage).toHaveBeenCalledTimes(1);
    const args = (ctx as any).drawImage.mock.calls[0];
    // drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh) — args[0] is img, args[6] is dy
    expect(args[0]).toBe(sources[1]);
    // dy = img1.y - yStart = 1040 - 1020 = 20
    expect(args[6]).toBe(20);
    // dh = visBottom - visTop = 1640 - 1040 = 600
    expect(args[8]).toBe(600);
  });

  it("banner item (i >= sources.length) draws watermark text instead of drawImage", () => {
    const ctx = mockCtx();
    // One real image at y=0, height=1000; banner item at y=1000, height=WATERMARK_HEIGHT
    const items: LayoutItem[] = [
      { y: 0, height: 1000, scale: 1 },
      { y: 1000, height: WATERMARK_HEIGHT, scale: 1 }, // banner
    ];
    const sources = [fakeImg("a")]; // only 1 source, banner has none
    const origSizes = [{ w: 800, h: 1000 }];
    // Segment covers only the banner range
    renderSegment(
      ctx,
      { yStart: 1000, yEnd: 1000 + WATERMARK_HEIGHT },
      800,
      items,
      sources,
      origSizes
    );
    // drawImage should NOT be called for the banner
    expect((ctx as any).drawImage).not.toHaveBeenCalled();
    // fillText should be called with watermark text
    const calls = (ctx as any).fillText.mock.calls;
    expect(calls.length).toBe(1);
    expect(calls[0][0]).toBe("Formatted by ToonSlice.com");
    // x = WATERMARK_PADDING_LEFT = 16
    expect(calls[0][1]).toBe(16);
    // dy = visTop - yStart = 1000 - 1000 = 0; y = dy + WATERMARK_TEXT_BASELINE = 0 + 38 = 38
    expect(calls[0][2]).toBe(38);
  });
});
