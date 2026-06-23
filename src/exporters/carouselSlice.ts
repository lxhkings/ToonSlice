import type { ChannelSpec } from "../channels/types";
import type { ImageSize } from "../core/layout";
import { computeLayout } from "../core/layout";
import { sliceSegments } from "../core/slice";
import { renderSegment } from "../core/render";
import type { CanvasFactory } from "./verticalSlice";

export type CarouselAspect = "4:5" | "1:1";

const ASPECT_RATIO: Record<CarouselAspect, number> = {
  "4:5": 1350 / 1080,
  "1:1": 1,
};

// Height of a square-width carousel card for the given aspect ratio.
export function pageHeightFor(width: number, aspect: CarouselAspect): number {
  return Math.round(width * ASPECT_RATIO[aspect]);
}

export interface CarouselExportInput {
  sources: CanvasImageSource[];
  origSizes: ImageSize[];
  spec: ChannelSpec;
  gutter: number;
  watermark: boolean;
  aspect: CarouselAspect;
  canvasFactory: CanvasFactory;
}

// Pipeline: layout → slice(maxH = pageHeight) → pad each segment to a uniform
// canvasWidth x pageHeight card (white fill, top-aligned content) → toBlob.
// renderSegment is untouched; it only fills/draws over [0, segH), so
// pre-filling the full pageHeight-tall canvas white first leaves the
// unused bottom strip blank on short (e.g. final) segments.
export async function exportCarouselSlice(
  input: CarouselExportInput
): Promise<Blob[]> {
  const { sources, origSizes, spec, gutter, watermark, aspect, canvasFactory } =
    input;
  const pageHeight = pageHeightFor(spec.canvasWidth, aspect);
  const layout = computeLayout(origSizes, spec.canvasWidth, gutter, watermark);
  const segments = sliceSegments(layout.totalHeight, layout.gutters, pageHeight);

  const blobs: Blob[] = [];
  for (const seg of segments) {
    const handle = canvasFactory(spec.canvasWidth, pageHeight);
    handle.ctx.fillStyle = "#ffffff";
    handle.ctx.fillRect(0, 0, spec.canvasWidth, pageHeight);
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
