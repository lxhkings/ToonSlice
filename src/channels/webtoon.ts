import type { ChannelSpec } from "./types";

export const webtoon: ChannelSpec = {
  id: "webtoon",
  label: "Webtoon",
  canvasWidth: 800,
  maxSegmentHeight: 1280,
  maxFileSize: 10 * 1024 * 1024,
  format: "image/png",
  exporter: "verticalSlice",
  seo: {
    keyword: "webtoon panel size",
    title: "Webtoon Panel Size & Free Slicer (2026) | ToonSlice",
    description:
      "Format and slice your comic to Webtoon-ready panels in your browser. No upload.",
  },
};
