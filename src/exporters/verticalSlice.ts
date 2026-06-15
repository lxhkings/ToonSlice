import type { ChannelSpec } from "../channels/types";
import type { ImageSize } from "../core/layout";
import { computeLayout } from "../core/layout";
import { sliceSegments } from "../core/slice";
import { renderSegment } from "../core/render";

export interface CanvasHandle {
  ctx: CanvasRenderingContext2D;
  toBlob: () => Promise<Blob>;
}

export type CanvasFactory = (w: number, h: number) => CanvasHandle;

export interface ExportInput {
  sources: CanvasImageSource[];
  origSizes: ImageSize[];
  spec: ChannelSpec;
  gutter: number;
  watermark: boolean;
  canvasFactory: CanvasFactory;
}

// Pipeline: layout → slice → per-segment render → toBlob.
// watermark flag reserved for Task 9 (banner rendering).
export async function exportVerticalSlice(
  input: ExportInput
): Promise<Blob[]> {
  const { sources, origSizes, spec, gutter, canvasFactory } = input;
  const layout = computeLayout(origSizes, spec.canvasWidth, gutter);
  const segments = sliceSegments(
    layout.totalHeight,
    layout.gutters,
    spec.maxSegmentHeight
  );

  const blobs: Blob[] = [];
  for (const seg of segments) {
    const h = seg.yEnd - seg.yStart;
    const handle = canvasFactory(spec.canvasWidth, h);
    renderSegment(
      handle.ctx,
      seg,
      spec.canvasWidth,
      layout.items,
      sources,
      origSizes
    );
    blobs.push(await handle.toBlob());
  }
  return blobs;
}
