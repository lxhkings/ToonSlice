import type { ChannelSpec } from "../channels/types";
import type { ImageSize } from "../core/layout";
import {
  exportVerticalSlice,
  type CanvasFactory,
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

// Orchestrate: loaded images → segment blobs → zip ArrayBuffer.
// Branches on spec.exporter: verticalSlice for the default pipeline,
// carouselSlice for carouselPage specs (e.g. Instagram).
// CanvasFactory injected for test/browser switching.
export async function runExport(
  loaded: LoadedLike[],
  spec: ChannelSpec,
  gutter: number,
  watermark: boolean,
  canvasFactory: CanvasFactory,
  aspect: CarouselAspect = "4:5"
): Promise<ArrayBuffer> {
  const sources = loaded.map((l) => l.image);
  const origSizes = loaded.map((l) => l.size);

  if (spec.exporter === "carouselPage") {
    const blobs = await exportCarouselSlice({
      sources,
      origSizes,
      spec,
      gutter,
      watermark,
      aspect,
      canvasFactory,
    });
    return packZip(blobs, "slide");
  }

  const blobs = await exportVerticalSlice({
    sources,
    origSizes,
    spec,
    gutter,
    watermark,
    canvasFactory,
  });
  return packZip(blobs, "panel");
}
