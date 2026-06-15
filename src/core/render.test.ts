import { describe, it, expect, vi } from "vitest";
import { renderSegment } from "./render";
import type { LayoutItem } from "./layout";

const fakeImg = (id: string) => ({ id }) as unknown as CanvasImageSource;

function mockCtx() {
  return {
    fillStyle: "",
    fillRect: vi.fn(),
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D & {
    drawImage: ReturnType<typeof vi.fn>;
    fillRect: ReturnType<typeof vi.fn>;
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
});
