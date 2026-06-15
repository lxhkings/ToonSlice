import type { ChannelSpec } from "./types";

export const tapas: ChannelSpec = {
  id: "tapas",
  label: "Tapas",
  canvasWidth: 940,
  maxSegmentHeight: 1280,
  maxFileSize: 10 * 1024 * 1024,
  format: "image/png",
  exporter: "verticalSlice",
  seo: {
    keyword: "tapas comic dimensions",
    title: "Tapas Comic Dimensions & Free Slicer | ToonSlice",
    description:
      "Slice your comic to Tapas-ready episode panels in your browser. No upload.",
  },
};
