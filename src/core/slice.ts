import type { GutterGap } from "./layout";

export interface Segment {
  yStart: number;
  yEnd: number;
}

// Gutter-priority: for each segment target cursor+maxH, find the last gutter
// whose midpoint falls in (cursor, cursor+maxH], cut there. No gutter → hard cut at cursor+maxH.
// Final segment uses actual totalHeight.
export function sliceSegments(
  totalHeight: number,
  gutters: GutterGap[],
  maxH: number
): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  while (cursor < totalHeight) {
    const limit = cursor + maxH;
    if (limit >= totalHeight) {
      segments.push({ yStart: cursor, yEnd: totalHeight });
      break;
    }
    const inRange = gutters.filter((g) => {
      const mid = (g.start + g.end) / 2;
      return mid > cursor && mid <= limit;
    });
    let cut: number;
    if (inRange.length > 0) {
      const last = inRange[inRange.length - 1];
      cut = (last.start + last.end) / 2;
    } else {
      cut = limit;
    }
    segments.push({ yStart: cursor, yEnd: cut });
    cursor = cut;
  }
  return segments;
}
