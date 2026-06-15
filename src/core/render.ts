import type { LayoutItem, ImageSize } from "./layout";
import type { Segment } from "./slice";

// Render a single segment onto ctx: white background + drawImage with source clipping
// for each image whose layout bounds intersect [seg.yStart, seg.yEnd).
// origSizes[i] is the original pixel dimensions for image i;
// items[i] is its scaled layout position.
export function renderSegment(
  ctx: CanvasRenderingContext2D,
  seg: Segment,
  width: number,
  items: LayoutItem[],
  sources: CanvasImageSource[],
  origSizes: ImageSize[]
): void {
  const segH = seg.yEnd - seg.yStart;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, segH);

  items.forEach((it, i) => {
    const top = it.y;
    const bottom = it.y + it.height;
    // intersection with segment (in layout coords)
    const visTop = Math.max(top, seg.yStart);
    const visBottom = Math.min(bottom, seg.yEnd);
    if (visBottom <= visTop) return;

    // Banner item (no corresponding source): draw watermark text
    if (i >= sources.length) {
      const dy = visTop - seg.yStart;
      ctx.fillStyle = "#000000";
      ctx.font = "20px sans-serif";
      ctx.fillText("Formatted by ToonSlice.com", 16, dy + 38);
      return;
    }

    // source cropping (original pixels): layout→source via 1/scale
    const invScale = origSizes[i].h / it.height; // = 1/scale (via height)
    const sx = 0;
    const sy = (visTop - top) * invScale;
    const sw = origSizes[i].w;
    const sh = (visBottom - visTop) * invScale;
    // destination (segment canvas coords)
    const dx = 0;
    const dy = visTop - seg.yStart;
    const dw = width;
    const dh = visBottom - visTop;
    ctx.drawImage(sources[i], sx, sy, sw, sh, dx, dy, dw, dh);
  });
}
