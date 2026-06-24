import type { ChannelSpec } from "../channels/types";
import type { ImageSize } from "../core/layout";
import {
  exportVerticalSlice,
  type CanvasFactory,
  type ExportFormat,
} from "../exporters/verticalSlice";
import {
  exportCarouselSlice,
  type CarouselAspect,
} from "../exporters/carouselSlice";
import { packZip } from "../pack/zip";

export interface LoadedLike {
  image: CanvasImageSource;
  size: ImageSize;
}

export interface ExportResult {
  buf: ArrayBuffer;
  sizes: number[];
}

// Orchestrate: loaded images → segment blobs → zip ArrayBuffer + per-panel sizes.
// Branches on spec.exporter: verticalSlice for the default pipeline,
// carouselSlice for carouselPage specs (e.g. Instagram).
// CanvasFactory injected for test/browser switching.
export async function runExport(
  loaded: LoadedLike[],
  spec: ChannelSpec,
  gutter: number,
  watermark: boolean,
  canvasFactory: CanvasFactory,
  aspect: CarouselAspect = "4:5",
  format: ExportFormat = "image/jpeg",
  quality: number = 0.9
): Promise<ExportResult> {
  const sources = loaded.map((l) => l.image);
  const origSizes = loaded.map((l) => l.size);

  let blobs: Blob[];
  let baseName: string;
  if (spec.exporter === "carouselPage") {
    blobs = await exportCarouselSlice({
      sources,
      origSizes,
      spec,
      gutter,
      watermark,
      aspect,
      canvasFactory,
      format,
      quality,
    });
    baseName = "slide";
  } else {
    blobs = await exportVerticalSlice({
      sources,
      origSizes,
      spec,
      gutter,
      watermark,
      canvasFactory,
      format,
      quality,
    });
    baseName = "panel";
  }

  const buf = await packZip(blobs, baseName, format);
  const sizes = blobs.map((b) => b.size);
  return { buf, sizes };
}
