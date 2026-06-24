import type { CanvasFactory } from "../exporters/verticalSlice";

// Browser canvas factory — inject into exporter.
export const browserCanvasFactory: CanvasFactory = (w, h, format, quality) => {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  return {
    ctx,
    toBlob: () =>
      new Promise<Blob>((resolve, reject) =>
        cv.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("TOBLOB_FAILED"))),
          format,
          quality
        )
      ),
  };
};
