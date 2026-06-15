import type { ChannelSpec } from "./types";

export const x: ChannelSpec = {
  id: "x",
  label: "X / Twitter",
  canvasWidth: 1200,
  maxSegmentHeight: 4096,
  maxFileSize: 10 * 1024 * 1024,
  format: "image/png",
  exporter: "verticalSlice",
  seo: {
    keyword: "twitter comic image size",
    title: "X / Twitter Comic Image Size & Free Slicer | ToonSlice",
    description:
      "Resize and slice your comic for X / Twitter in your browser. No upload.",
  },
};
