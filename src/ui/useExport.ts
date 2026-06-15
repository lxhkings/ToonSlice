import type { ChannelSpec } from "../channels/types";
import type { ImageSize } from "../core/layout";
import {
  exportVerticalSlice,
  type CanvasFactory,
} from "../exporters/verticalSlice";
import { packZip } from "../pack/zip";

export interface LoadedLike {
  image: CanvasImageSource;
  size: ImageSize;
}

// Orchestrate: loaded images → segment blobs → zip ArrayBuffer.
// CanvasFactory injected for test/browser switching.
export async function runExport(
  loaded: LoadedLike[],
  spec: ChannelSpec,
  gutter: number,
  watermark: boolean,
  canvasFactory: CanvasFactory
): Promise<ArrayBuffer> {
  const blobs = await exportVerticalSlice({
    sources: loaded.map((l) => l.image),
    origSizes: loaded.map((l) => l.size),
    spec,
    gutter,
    watermark,
    canvasFactory,
  });
  return packZip(blobs, "panel");
}
